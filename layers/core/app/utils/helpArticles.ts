/**
 * Help centre article content.
 *
 * Kept as data rather than four page components so the four articles cannot
 * drift apart in layout, and so the sidebar links in RightSideNavLinks have a
 * single list to stay in sync with.
 *
 * Every number here describes real platform behaviour — the 7-day window is
 * AUTO_RELEASE_DAYS in server/tasks/releaseShippedOrders.ts. If that changes,
 * change it here too.
 */

export interface HelpSection {
  heading: string
  body: string[]
  steps?: string[]
}

export interface HelpArticle {
  eyebrow: string
  title: string
  intro: string
  sections: HelpSection[]
}

export const HELP_ARTICLES: Record<string, HelpArticle> = {
  'getting-started': {
    eyebrow: 'Getting started',
    title: 'Getting started',
    intro:
      'How to set up an account, find things worth buying, and know who you are buying from.',
    sections: [
      {
        heading: 'Create your account',
        body: [
          'You can browse the feed, reels and seller stores without an account. You need one to buy, follow sellers, or leave a review.',
        ],
        steps: [
          'Sign up with your email, phone number, or a linked Google or Facebook account.',
          'Verify your email or phone. Unverified accounts cannot check out.',
          'Add a delivery address. You can add more later and pick one per order.',
        ],
      },
      {
        heading: 'Finding things',
        body: [
          'Discover is the catalog. Reels are short videos from sellers and real buyers, which is usually the fastest way to see what an item actually looks like.',
          'Squares group sellers by market or category, so you can shop a physical market or a trade association as a single place.',
        ],
      },
      {
        heading: 'Checking a seller before you buy',
        body: [
          'Every seller has a public profile with their verification status, completed order count, and reviews left by buyers who actually bought.',
          'Verified sellers have had their identity and business documents checked by us. A seller with few completed orders is not necessarily a bad seller, but the record behind them is thinner.',
        ],
      },
      {
        heading: 'Your money is held, not sent',
        body: [
          'When you pay, the money goes into escrow rather than straight to the seller. It is released once you confirm delivery, or automatically 7 days after the item ships if you never respond.',
          'That window is the point of the platform: if something goes wrong before it closes, the money is still with us.',
        ],
      },
    ],
  },

  orders: {
    eyebrow: 'Orders',
    title: 'Orders & tracking',
    intro:
      'What each order status means, how tracking works, and when a seller actually gets paid.',
    sections: [
      {
        heading: 'Order statuses',
        body: [
          'Pending means we have the order but payment has not cleared. Paid or Confirmed means the seller has been notified and should be preparing the item.',
          'Shipped means it is with a carrier. Ready for pickup is the equivalent for pickup orders — the item is waiting for you at the seller.',
          'Delivered means you or the carrier confirmed receipt. Cancelled and Returned end the order, and reverse the payment.',
        ],
      },
      {
        heading: 'Tracking an order',
        body: [
          'Every order lives under My Orders in your profile, with its current status and history.',
        ],
        steps: [
          'Open My Orders from your profile menu.',
          'Pick the order to see its status, items, and the seller who is fulfilling it.',
          'If the seller shipped through a carrier, the tracking reference appears on the order.',
          'Message the seller from the order itself if something looks wrong — that keeps the conversation attached to the order.',
        ],
      },
      {
        heading: 'Confirming delivery',
        body: [
          'Confirm receipt as soon as the item arrives and is what you expected. That releases the seller their money and is the single biggest thing you can do for a seller you want to keep.',
          'If you do nothing, funds auto-release 7 days after the item ships or is marked ready for pickup. Do not treat that as a deadline to ignore — once released, getting money back is a dispute rather than a refund.',
        ],
      },
      {
        heading: 'Shipping',
        body: [
          'Sellers arrange their own delivery today — their own dispatch, a carrier they use, or pickup from their location. The cost is shown before you pay.',
        ],
      },
    ],
  },

  returns: {
    eyebrow: 'Returns',
    title: 'Returns & refunds',
    intro:
      'What to do when an item never arrives, arrives broken, or is not what was described.',
    sections: [
      {
        heading: 'Start with the seller',
        body: [
          'Most problems are a misunderstanding and get fixed in a message. Contact the seller from the order page so the exchange stays attached to the order — our team can read it if it escalates.',
          'Give them a clear description and photos. A seller who can see the problem can usually solve it.',
        ],
      },
      {
        heading: 'Opening a dispute',
        body: [
          'If the seller does not resolve it, open a dispute on the order. Do this before the 7-day auto-release closes — while the money is still in escrow, we can act on it directly.',
        ],
        steps: [
          'Open the order under My Orders.',
          'Choose Open a dispute and pick the reason.',
          'Describe what happened and attach photos. Evidence decides these cases.',
          'A support agent reviews both sides and decides. You will get the outcome by email and in the app.',
        ],
      },
      {
        heading: 'How refunds are paid',
        body: [
          'If a dispute is decided in your favour, the amount is returned to you and the seller credit is reversed.',
          'Refunds to your wallet are immediate. Refunds back to a card or bank account are processed by hand and can take several working days to appear, depending on your bank.',
        ],
      },
      {
        heading: 'After the window closes',
        body: [
          'Once funds have released, we no longer hold the money, so we cannot simply return it. You can still open a support ticket and we will contact the seller, but the outcome depends on them.',
          'This is why confirming or disputing promptly matters more here than on a marketplace that pays sellers weeks later.',
        ],
      },
    ],
  },

  sellers: {
    eyebrow: 'Selling',
    title: 'Seller guide',
    intro:
      'Opening a store, getting verified, listing well, and understanding when you get paid.',
    sections: [
      {
        heading: 'Open a store',
        body: [
          'Anyone with a verified account can open a store. You get a public storefront at your own URL and a shareable seller card with a QR code.',
        ],
        steps: [
          'Go to Open a store and pick your store name and URL.',
          'Add your bank account — this is where payouts land, so the name must match your account.',
          'Submit verification documents. Unverified stores can list, but buyers can see you are unverified.',
          'List your first product with real photos, honest sizing, and a price that includes what you expect to make.',
        ],
      },
      {
        heading: 'Getting verified',
        body: [
          'Verification checks your identity and, for registered businesses, your CAC documents. It is the strongest trust signal on your store and it visibly changes buyer behaviour.',
          'Reviews are checked once submitted. Expect a decision rather than an instant badge.',
        ],
      },
      {
        heading: 'When you get paid',
        body: [
          'Buyer payment goes into escrow, not into your wallet. It is credited to your seller wallet when the buyer confirms delivery, or automatically 7 days after you mark the order shipped or ready for pickup.',
          'From your wallet you request a payout to your bank account. Payouts are reviewed before they are sent.',
          'If a buyer opens a dispute and it is decided against you, the credit is reversed. Keeping proof of dispatch is worth the small effort.',
        ],
      },
      {
        heading: 'Reputation compounds',
        body: [
          'Completed orders, confirmed deliveries and genuine reviews build a record that follows your store. Cancellations and lost disputes count against it.',
          'The record is the asset. It is what lets a buyer who has never heard of you decide to send you money.',
        ],
      },
      {
        heading: 'Squares and associations',
        body: [
          'If you belong to a market or trade association on the platform, joining their Square puts your store in front of buyers browsing that group. The association takes an agreed cut of orders that come through it.',
        ],
      },
    ],
  },
}
