import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { stripe } from "../../services/stripe";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    const session = await getSession({ req });
    if (!session?.user?.email) return;
    const stripeCustomer = await stripe.customers.create({
      email: session.user.email,
      //TODO: metadata
    });
    const stripeCheckoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomer?.id,
      payment_method_types: ["card"],
      billing_address_collection: "required",
      cancel_url: process.env.STRIPE_CANCEL_URL || "",
      success_url: process.env.STRIPE_SUCCESS_URL || "",
      line_items: [{ price: "price_1J9KL2Ev5w6Gus76ZwiBYz7K", quantity: 1 }],
      mode: "subscription",
      allow_promotion_codes: true,
    });

    return res.status(200).json({ sessionId: stripeCheckoutSession?.id });
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method not allowed");
  }
};
