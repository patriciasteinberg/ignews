import { NextApiRequest, NextApiResponse } from "next";
import { query as q } from "faunadb";
import { getSession } from "next-auth/react";
import { stripe } from "../../services/stripe";
import { fauna } from "../../services/fauna";

interface IUser {
  ref?: {
    id?: string;
  };
  data?: {
    stripe_customer_id?: string;
  };
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    const session = await getSession({ req });
    if (!session?.user?.email) return;

    const user = await fauna.query<IUser>(
      q.Get(q.Match(q.Index("user_by_email"), q.Casefold(session.user.email)))
    );

    let customerId = user?.data?.stripe_customer_id;

    if (!customerId) {
      const stripeCustomer = await stripe.customers.create({
        email: session.user.email,
        //TODO: metadata
      });

      await fauna.query(
        q.Update(q.Ref(q.Collection("users"), user?.ref?.id), {
          data: {
            stripe_customer_id: stripeCustomer?.id,
          },
        })
      );

      customerId = stripeCustomer?.id;
    }

    const stripeCheckoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
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
