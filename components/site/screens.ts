export type CapturedScreen = {
  src: string;
  title: string;
  body: string;
};

/** Staff screens from the signed-in install, then the guest kiosk. */
export const capturedScreens: CapturedScreen[] = [
  {
    src: "/site/admin-dashboard.png",
    title: "The service day opens on the dashboard",
    body: "Today’s revenue, order count, and occupied tables sit at the top. Shortcuts jump to a new order, the floor, a reservation, the kitchen, or the menu. The page refreshes when a bill or a ticket changes.",
  },
  {
    src: "/site/admin-pos-floor.png",
    title: "The till starts from the floor",
    body: "Dining Room shows which tables are free and which are occupied. The kitchen chip counts tickets that are new, accepted, or preparing. Customer display opens the screen the guest faces.",
  },
  {
    src: "/site/admin-pos.png",
    title: "A table opens the live menu",
    body: "Staff scan a barcode or search the menu. Categories filter the grid. Each dish shows its price, including Tandoori Chicken, Butter Chicken, and the breads. The cart stays empty until a dish is added, and the kitchen does not see a draft.",
  },
  {
    src: "/site/admin-orders.png",
    title: "Open bills stay on the orders list",
    body: "In progress shows each ticket number, the guest, the channel, and the lines. Filters split new orders from history, and online from dine-in, takeaway, and delivery. A kiosk order lands here as soon as the guest confirms.",
  },
  {
    src: "/site/admin-kds.png",
    title: "The kitchen works one station at a time",
    body: "Open tickets are split across Bar, Main Kitchen, and Tandoor. Each card names the table, the guest, and how long it has been waiting. A late ticket is marked so the pass can see it.",
  },
  {
    src: "/site/admin-tables.png",
    title: "The floor plan is the live status",
    body: "Tap a table to update it. Indoor and outdoor areas, split, move, and table history sit above the plan. Occupied tables show how long the party has been seated.",
  },
  {
    src: "/site/admin-reservations.png",
    title: "Bookings hold a table before the party arrives",
    body: "Each card is a guest, a party size, a table, and a time, marked confirmed. New reservation adds another. Texts, no-shows, the cover forecast, and deposits are on the same page.",
  },
  {
    src: "/site/admin-menu.png",
    title: "The menu editor sets what the kiosk can sell",
    body: "Kiosk add-ons are groups the guest must pick: spice level, extra cheese, an extra patty, each with a price. Search, seasonal menus, scheduled prices, and stock-based prices are the other editors on this page.",
  },
  {
    src: "/site/admin-customers.png",
    title: "Guests earn a tier from paid bills",
    body: "Membership tiers set the points threshold and the multiplier used at checkout. RFM scores recency, frequency, and spend for this branch. Loyalty rules, rewards, and staff discounts are the other tabs.",
  },
  {
    src: "/site/admin-inventory.png",
    title: "Ingredients carry stock and a reorder level",
    body: "Basmati rice, lentils, and butter show the unit, the quantity on hand, and the level that should trigger a purchase. Suppliers, purchase orders, waste, counts, recipes, food cost, and the forecast are the rest of this section.",
  },
  {
    src: "/site/admin-accounting.png",
    title: "The books start from an expense",
    body: "A date, a category, an amount, and a note post an expense, including one paid from the till. Journals, cash close, profit and loss, the balance sheet, budgets, bank, GST, and branches are the other tabs. Tally posts only after that host is stored.",
  },
  {
    src: "/site/admin-reports.png",
    title: "Reports show when the restaurant was busy",
    body: "The heat map counts paid bills by weekday and hour in the restaurant’s timezone. Daily sales, sales by item, and sales by category sit under it. Floor, attention, saved reports, and the franchise view are linked above.",
  },
  {
    src: "/site/admin-agent.png",
    title: "Ask reads this branch and does not run the till",
    body: "The branch agent answers from sales, open orders, late tickets, low stock, and today’s reservations. The chips ask those questions in one tap. It does not take a payment, change a price, edit stock, or send a message.",
  },
  {
    src: "/site/staff-login.png",
    title: "Staff sign in on the restaurant computer",
    body: "The till, the kitchen, and the books open after email and password, or a passkey. A shared terminal can switch people with a PIN. An authenticator code is asked when that account has it turned on.",
  },
  {
    src: "/site/kiosk-start.png",
    title: "A guest starts from the restaurant’s name",
    body: "The lobby or table screen shows the branch, here ABA, and one button. Nothing is collected before the guest decides to order.",
  },
  {
    src: "/site/kiosk-service.png",
    title: "Eat here or take away",
    body: "The next screen is the service type. English and Spanish are on the same screen. Cancel returns to the start.",
  },
  {
    src: "/site/kiosk-menu.png",
    title: "The live menu, with photos and prices",
    body: "Categories run across the top. Search finds a dish. Each card shows the photo, a short description, the price, and add-ons. The basket total stays at the bottom.",
  },
  {
    src: "/site/kiosk-options.png",
    title: "Add-ons are chosen before the dish is added",
    body: "Paneer Tikka opens its options: extra cheese, a patty, fries, a drink, and more, each with its own price. The guest adds the dish only after that choice.",
  },
  {
    src: "/site/kiosk-review.png",
    title: "The guest checks the bill, then pays at the counter",
    body: "Quantity, a cooking note, and the line total are on the review. The price includes GST. Confirm sends the order. This screen says the guest pays at the counter, so the kiosk does not pretend to charge a card.",
  },
];

/** Short tour on the home page. The full set is on /orderlyPOS/features. */
const homeSrcs = [
  "/site/admin-dashboard.png",
  "/site/admin-pos.png",
  "/site/admin-kds.png",
  "/site/admin-agent.png",
  "/site/kiosk-menu.png",
];

export const homeScreens: CapturedScreen[] = homeSrcs.map(
  (src) => capturedScreens.find((screen) => screen.src === src)!,
);

export const staffScreens: { name: string; body: string }[] = [
  { name: "Dashboard", body: "Today’s sales, open orders, table status, the kitchen queue, and the latest bills. It refreshes when a bill or ticket changes." },
  { name: "Till", body: "Ring dine-in, takeaway, or delivery. Sizes, modifiers, combos, notes, discounts, split tender, and a bill that prints before it is paid." },
  { name: "Orders", body: "Open bills, repeat a paid order, move lines, table sessions, WhatsApp intake, curbside, and sync conflicts." },
  { name: "Tables", body: "The floor plan, indoor and outdoor areas, split or move a party, waitlist, and history for each table." },
  { name: "Reservations", body: "Bookings through the night, deposits, no-shows, a suggested table, and a forecast of covers." },
  { name: "Menu", body: "Dishes, categories, seasons, scheduled prices, SKU, and stock-based price changes." },
  { name: "Kitchen", body: "Stations, timers, one step at a time, expo, and a station report. Reprint is stamped." },
  { name: "Customers", body: "Profiles, loyalty rules, rewards, staff discounts, and which dishes a guest orders again." },
  { name: "Inventory", body: "Stock, recipes, food cost, prep, counts, waste, suppliers, and purchase orders." },
  { name: "Delivery", body: "Zones, drivers, and a tracking link for the order that left the restaurant." },
  { name: "Team", body: "Shifts, leave, clocked hours, and payroll." },
  { name: "Accounting", body: "The drawer, expenses, profit and loss, tax, and journals. A Tally post runs when that host is stored." },
  { name: "Approvals", body: "A large discount, a void, or a refund can wait for a manager when those rules are on." },
  { name: "Reports", body: "Sales, the floor, what needs attention, saved reports, and a 14-day chart." },
  { name: "Ask", body: "The branch agent reads this branch. The restaurant agent compares branches this login can already open. The chat does not take a payment." },
  { name: "Franchise", body: "Orders, sales, covers, and no-shows for every branch. Head office can lock menu prices." },
  { name: "Marketing", body: "Coupons, happy hour, category discounts, buy-and-get, and conditions." },
  { name: "Operations", body: "Equipment schedules and the documents the floor keeps." },
  { name: "Attendance", body: "Clock in and clock out for the shift that is open." },
  { name: "Settings", body: "Roles, payments, devices, backups, automation, brands, and the connectors that stay off until an address and a secret are stored." },
];
