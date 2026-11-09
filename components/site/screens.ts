export type CapturedScreen = {
  src: string;
  title: string;
  body: string;
};

/** Marketing counts — from admin nav, dashboard routes, settings tabs, guest surfaces. */
export const FEATURE_COUNTS = {
  modules: 21,
  screens: 100,
  settings: 26,
  guestChannels: 4,
} as const;

export const featureCountLine = `${FEATURE_COUNTS.modules} core modules · ${FEATURE_COUNTS.screens}+ staff screens · ${FEATURE_COUNTS.settings} settings areas · ${FEATURE_COUNTS.guestChannels} order channels`;

/** Staff screens from the signed-in install, then the guest kiosk. */
export const capturedScreens: CapturedScreen[] = [
  {
    src: "/site/admin-dashboard.png",
    title: "The service day opens on the dashboard",
    body: "Today’s revenue, order count, and occupied tables sit at the top. Shortcuts jump to a new order, the floor, a reservation, the kitchen, or the menu. The page refreshes when a bill or a ticket changes.",
  },
  {
    src: "/site/admin-pos.png",
    title: "The till opens on the live floor",
    body: "Dining Room, Terrace, and Private Room show free and occupied tables. Occupied tiles show open bill totals and how long the party has been seated. Pass, Floor, Menu, and Sales stay under the thumb.",
  },
  {
    src: "/site/admin-orders.png",
    title: "Open bills stay on the orders board",
    body: "In progress shows each ticket, guest, channel, and lines. Repeat, transfer lines, table sessions, WhatsApp intake, curbside, and sync conflicts sit beside the board.",
  },
  {
    src: "/site/admin-kds.png",
    title: "The kitchen works one station at a time",
    body: "Status board, stations, expo, and a station report. Each card names the table and how long it has waited. A late ticket is marked on the pass. Reprint is stamped.",
  },
  {
    src: "/site/admin-tables.png",
    title: "The floor plan is the live status",
    body: "Areas, split, move, and table history sit above the plan. Occupied tables show how long the party has been seated.",
  },
  {
    src: "/site/admin-reservations.png",
    title: "Bookings hold a table before the party arrives",
    body: "Bookings, follow-up texts, no-shows, cover forecast, and deposits stay on one module. A suggested table can seat the party when they arrive.",
  },
  {
    src: "/site/admin-approvals.png",
    title: "Large discounts and voids can wait for a manager",
    body: "Approvals hold a discount, void, or refund when those rules are on. Managers clear the queue without leaving the floor.",
  },
  {
    src: "/site/admin-menu.png",
    title: "The menu editor sets what every channel can sell",
    body: "Dishes, add-ons, channels, scheduling, kitchen routing, SKU, seasons, scheduled prices, and stock-based prices. The same menu feeds till, QR, kiosk, and WhatsApp.",
  },
  {
    src: "/site/admin-customers.png",
    title: "Guests, loyalty, rewards, and gift cards",
    body: "Profiles, RFM analytics, loyalty tiers, rewards, gift cards, and staff discounts. Paid bills feed the points a guest can spend next visit.",
  },
  {
    src: "/site/admin-inventory.png",
    title: "Stock, recipes, and food cost in one place",
    body: "Ingredients, suppliers, purchase orders, procurement, transfers, waste, counts, yield, prep, price variance, forecast, food cost, units, recipes, engineering, anomalies, and alerts.",
  },
  {
    src: "/site/admin-delivery.png",
    title: "Delivery keeps a live map and drivers",
    body: "Live map, active runs, history, zones, and tracking. Assign a driver, replay a trail, and refresh positions while the order is out.",
  },
  {
    src: "/site/admin-team.png",
    title: "Team covers shifts and the people on them",
    body: "Shifts, leave, clocked hours, and payroll for the branch. Attendance clocks the open shift beside it.",
  },
  {
    src: "/site/admin-accounting.png",
    title: "The books start from expenses and the drawer",
    body: "Expenses, petty cash, journals, Tally, cash close, profit and loss, balance sheet, budgets, bank, GST, branches, locks, and tills. Connectors post only after that host is stored.",
  },
  {
    src: "/site/admin-gst.png",
    title: "GST billing from paid orders",
    body: "Tax invoices, returns, and required fields for the branch. Prices already include GST. Another state is IGST.",
  },
  {
    src: "/site/admin-reports.png",
    title: "Reports show when the restaurant was busy",
    body: "Heat map, floor performance, attention alerts, saved reports, and business intelligence. Franchise compares branches this login can already open.",
  },
  {
    src: "/site/admin-agent.png",
    title: "Ask reads this branch and does not run the till",
    body: "The branch agent answers from sales, open orders, late tickets, low stock, and today’s reservations. It does not take a payment, change a price, edit stock, or send a message.",
  },
  {
    src: "/site/admin-franchise.png",
    title: "Franchise compares every branch you can open",
    body: "Orders, sales, covers, and no-shows across locations. Head office can lock menu prices when that rule is on.",
  },
  {
    src: "/site/admin-marketing.png",
    title: "Coupons, happy hour, and campaigns",
    body: "Codes, happy hour, bulk campaigns, category discounts, buy-and-get, and promo conditions. Cashiers enter a code at checkout.",
  },
  {
    src: "/site/admin-operations.png",
    title: "Operations keeps equipment and floor documents",
    body: "Equipment schedules and the documents the floor keeps for the shift.",
  },
  {
    src: "/site/admin-attendance.png",
    title: "Attendance clocks the open shift",
    body: "Clock in and clock out for the people working tonight.",
  },
  {
    src: "/site/admin-settings.png",
    title: "Settings turns every restaurant preference on or off",
    body: "Profile, staff, roles, audit log, backup, updates, API keys, security, webhooks, food platforms, WhatsApp catalog, payments, card terminals, house accounts, fleet, currencies, brands, apps, catalog, developer, devices, network, fields, and automation. Connectors stay quiet until an address and secret are stored.",
  },
  {
    src: "/site/staff-login.png",
    title: "Staff sign in on phone, tablet, kiosk, or till",
    body: "Email and password, or a passkey. A shared terminal can switch people with a PIN. An authenticator code is asked when that account has it turned on.",
  },
  {
    src: "/site/kiosk-start.png",
    title: "A guest starts from the restaurant’s name",
    body: "The lobby or table screen shows the branch and one button. Nothing is collected before the guest decides to order.",
  },
  {
    src: "/site/kiosk-service.png",
    title: "Eat here or take away",
    body: "The next screen is the service type. Language choices sit on the same screen. Cancel returns to the start.",
  },
  {
    src: "/site/kiosk-menu.png",
    title: "The live menu, with photos and prices",
    body: "Categories run across the top. Search finds a dish. Each card shows the photo, a short description, the price, and add-ons. The basket total stays at the bottom.",
  },
  {
    src: "/site/kiosk-options.png",
    title: "Add-ons are chosen before the dish is added",
    body: "A dish opens its options — each with its own price. The guest adds the dish only after that choice.",
  },
  {
    src: "/site/kiosk-review.png",
    title: "The guest checks the bill, then pays at the counter",
    body: "Quantity, a cooking note, and the line total are on the review. Confirm sends the order. Payment stays where the restaurant set it.",
  },
];

/** Short tour on the home page. The full set is on /orderlyPOS/features. */
const homeSrcs = [
  "/site/admin-dashboard.png",
  "/site/admin-pos.png",
  "/site/admin-kds.png",
  "/site/admin-delivery.png",
  "/site/admin-marketing.png",
  "/site/admin-agent.png",
  "/site/kiosk-menu.png",
];

export const homeScreens: CapturedScreen[] = homeSrcs.map(
  (src) => capturedScreens.find((screen) => screen.src === src)!,
);

/** Every signed-in module from the admin nav — nothing omitted. */
export const staffScreens: { name: string; body: string }[] = [
  {
    name: "Dashboard",
    body: "Today’s sales, open orders, table status, kitchen queue, recent bills, and order channels. Refreshes when a bill or ticket changes.",
  },
  {
    name: "Till",
    body: "Pass, Floor, Menu, and Sales. Dine-in, takeaway, delivery, modifiers, combos, notes, discounts, split tender, customer display, and a bill that prints before it is paid.",
  },
  {
    name: "Orders",
    body: "Live board, repeat a paid order, transfer lines, table sessions, WhatsApp intake, curbside staging, and sync conflicts.",
  },
  {
    name: "Tables",
    body: "Floor plan, indoor and outdoor areas, split or move a party, waitlist, and table history.",
  },
  {
    name: "Reservations",
    body: "Bookings, follow-up texts, no-shows, cover forecast, and deposits.",
  },
  {
    name: "Kitchen",
    body: "Status board, stations, expo / pass, station report. Accept, prepare, ready, serve. Reprint is stamped.",
  },
  {
    name: "Approvals",
    body: "Manager queue for a large discount, void, or refund when those rules are on.",
  },
  {
    name: "Menu",
    body: "Dishes, add-ons, channels, scheduling, kitchen routing, SKU, seasons, scheduled prices, and stock-based prices.",
  },
  {
    name: "Customers",
    body: "Guest list, RFM analytics, loyalty rules, rewards, gift cards, and staff discounts.",
  },
  {
    name: "Inventory",
    body: "Ingredients, suppliers, purchase orders, procurement, transfers, waste, counts, yield, prep, price variance, forecast, food cost, units, recipes, menu engineering, anomalies, and alerts.",
  },
  {
    name: "Delivery",
    body: "Live map, active runs, history, zones, driver assign, trail replay, and tracking settings.",
  },
  {
    name: "Team",
    body: "Shifts, leave, clocked hours, and payroll.",
  },
  {
    name: "Accounting",
    body: "Expenses, petty cash, journals, Tally, cash close, P&L, balance sheet, budgets, bank, GST, branches, period locks, and tills.",
  },
  {
    name: "GST billing",
    body: "Tax invoices, returns, and required fields from paid orders for the branch.",
  },
  {
    name: "Reports",
    body: "Overview heat map, floor performance, attention, saved reports, and business intelligence.",
  },
  {
    name: "Ask",
    body: "Branch agent reads this branch. Restaurant agent compares branches this login can open. Does not take a payment.",
  },
  {
    name: "Franchise",
    body: "Orders, sales, covers, and no-shows across branches. Head office can lock menu prices.",
  },
  {
    name: "Marketing",
    body: "Coupons, happy hour, campaigns, category discounts, buy-and-get, and promo conditions.",
  },
  {
    name: "Operations",
    body: "Equipment schedules and floor documents.",
  },
  {
    name: "Attendance",
    body: "Clock in and clock out for the open shift.",
  },
  {
    name: "Settings",
    body: "Profile, staff, roles, audit log, backup, updates, API keys, security, webhooks, Zomato / Swiggy, WhatsApp catalog, payments, card terminals, house accounts, fleet, currencies, brands, apps, catalog, developer, devices, network, fields, and automation.",
  },
];
