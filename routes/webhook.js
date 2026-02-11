require("dotenv").config();
const { Firma } = require("../source/db");
const Stripe = require("stripe");
const stripe = new Stripe(process.env.PRIVATE_KEY);

module.exports = firmaWebhook = (app) => {
  app.post("/webhook", express.raw({ type: '*/*' }), async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body, // raw body!
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("❌ Webhook signature verification failed:", err.message);
      return res.sendStatus(400);
    }

    try {
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;

        if (session.mode === "subscription") {
          const subscriptionId = session.subscription;

          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const firmaId = session.client_reference_id;
          const firma = await Firma.findByPk(firmaId);

          if (firma) {
            firma.subscription = "premium";
            firma.stripeCustomerId = subscription.customer;
            firma.expireAt = new Date(subscription.current_period_end * 1000);
            await firma.save();

            console.log(`✅ Firma ${firma.name} upgraded to PREMIUM`);
          }
        }
      }
      if (event.type === "invoice.payment_failed") {
        const invoice = event.data.object;

        const firma = await Firma.findOne({
          where: { stripeCustomerId: invoice.customer },
        });

        if (firma) {
          firma.subscription = "free";
          await firma.save();

          console.log(`⚠️ Firma ${firma.name} downgraded to FREE (payment failed)`);
        }
      }
      if (event.type === "customer.subscription.deleted") {
        const subscription = event.data.object;

        const firma = await Firma.findOne({
          where: { stripeCustomerId: subscription.customer },
        });

        if (firma) {
          firma.subscription = "free";
          firma.expireAt = null;
          await firma.save();

          console.log(`🛑 Firma ${firma.name} subscription cancelled`);
        }
      }

      res.json({ received: true });
    } catch (err) {
      console.error("❌ Webhook processing failed:", err);
      res.sendStatus(500);
    }
  });
};
