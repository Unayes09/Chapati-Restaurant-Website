# Restaurant Website & Operations Platform

## Overview

This is a fully branded restaurant website with an integrated online ordering, table-reservation, customer-contact, and staff-management system. It can be adapted to a restaurant's own name, logo, colours, menu, contact details, opening hours, language, and external delivery links.

The platform consists of two connected experiences:

- **Customer website** — a polished, mobile-friendly website where guests can explore the restaurant, place collection orders, reserve a table, and get in touch.
- **Private admin dashboard** — a secure staff area for handling orders, reservations, customer messages, live alerts, and operational reporting.



## Customer Website Features



### Brand-led restaurant website

- Bespoke landing page with hero section, restaurant concept, food imagery, menu highlights, customer reviews, partner/delivery links, and footer information.
- Brand identity can be tailored with the client's name, logo, colour palette, food photos, descriptions, social profiles, location, opening hours, and payment-method display.
- Responsive layout designed for desktop, tablet, and mobile use.
- Mobile navigation menu for a smooth experience on smaller screens.



### Multilingual experience

- Built-in language switcher for French/Others and English.
- Website content, navigation, menu labels, forms, and customer-facing messages can be presented in both languages.
- Language content can be customised for the client’s preferred markets.



### Interactive full menu

- A dedicated full-menu page for displaying all food and drink categories.
- Category navigation helps guests find dishes quickly.
- Each item can show its name, price, description, and image where required.
- Guests can add menu items to a basket directly from the menu.
- Quantities can be increased or decreased before checkout.
- Suitable for restaurant-specific categories such as starters, mains, grills, desserts, drinks, set menus, and more.



### Spice-level selection

- Selected dishes can offer a spice-level choice.
- Spice preferences are captured per portion, so a guest can order multiple servings of the same dish with different heat levels.
- The chosen preference travels with the order to the staff dashboard.



### Click-and-collect ordering

- Customers can review their basket before submitting an order.
- Clear order summary with item quantities, individual prices, subtotal, service fee display, and total.
- Customer checkout form captures name, email address, phone number, preferred collection time, and optional notes.
- Collection-time options are available in 15-minute increments: 15, 30, 45, or 60 minutes.
- Useful notes can be included, for example allergies, dietary requirements, or special instructions.
- Customer details are remembered in the browser for faster repeat ordering or reservation requests.
- The customer receives an immediate on-screen confirmation after sending the order.



### Order confirmation emails

- Customers receive an email when their order request is received.
- Once staff accepts an order, the customer receives the confirmed collection time and a pickup code.
- If an order cannot be fulfilled, staff can reject it and the customer receives a status email.
- Restaurant notification emails can also be enabled, so the team receives the order and customer details by email.



### Table reservations

- Dedicated reservation page for guests to book a table online.
- Guests select party size, date, time, and contact details, with a field for extra requests.
- Configurable table-size choices; the current setup supports 2, 4, 6, and 8 guests.
- Available times are generated in 15-minute slots based on the restaurant’s opening schedule.
- Same-day bookings automatically hide times that are too close to the current time, allowing staff adequate notice.
- Date selection supports advance bookings up to three years ahead.
- Reservations are confirmed on submission and a confirmation email is sent to the guest.



### Contact, location, and social presence

- Contact form for customer enquiries, including name, email, telephone number, and message.
- Clear display of phone number, email address, physical address, and opening hours.
- Quick links to social profiles, Google business listing/maps, and external delivery partners.
- External delivery links can be connected to the restaurant’s chosen provider.
- Customer messages are delivered to the private admin inbox for follow-up.



## Private Admin Dashboard



### Secure staff access

- Password-protected admin login.
- Authenticated access using secure access tokens.
- Customer and operational data is kept separate from the public website.



### Live order management

- New collection orders appear in the dashboard in real time; staff do not need to keep refreshing the page.
- Optional audible alert for new orders, enabled by a staff member with one click.
- A live order alert presents the customer details, items, spice preferences, notes, total, requested time, and order code.
- If several orders arrive together, they are handled in a queue.
- Staff can accept an order and set the actual confirmed collection time.
- Staff can reject an order when it cannot be fulfilled.
- Accepted orders can be marked as collected when handed over.
- Each order follows a clear status flow: **Pending → Received → Collected**, or **Rejected**.
- Staff can print a clean receipt for an order.



### Order search and filters

- Search orders by customer name, email, phone number, or order code.
- Filter by order status, creation date, reservation date/time, table size, and order type.
- View collection orders and table reservations separately or through the same operational view.
- Paginated results keep larger order histories easy to manage.



### Reservation management

- Dedicated reservation list for staff.
- Search reservations by customer details or booking code.
- Filter reservations by a single date or date range.
- Quick option to view today's bookings.
- Booking cards show party size, booking date/time, customer contact details, notes, status, and reference code.
- Staff can confirm or reject reservations when needed.



### Customer message inbox

- All website contact-form submissions arrive in a central inbox.
- Search messages by customer name, email, telephone number, or message content.
- Filter messages by new or read status.
- Expand a message to view full customer and enquiry details.
- One-click email and phone links make replying easy.
- Staff can mark messages as read or permanently delete completed enquiries.



## Reporting & Business Insights

The dashboard includes a rolling 30-day operational view to help the restaurant understand demand and performance.

- Total collection orders, table reservations, and customer messages.
- Collection-order revenue and average order value.
- Average number of items per collection order.
- Order, reservation, and message volume over time, including a 14-day visual trend chart.
- Collection-order and reservation status breakdowns.
- Hourly collection-order pattern to identify busy periods.
- Most ordered menu items.
- Reservation distribution by party size.
- New versus read message counts.
- Collection-order versus table-reservation mix.



## Data Management

- Staff can choose how long to retain orders, reservations, and contact messages.
- Separate cleanup controls support deleting records older than a chosen retention period, such as 15, 30, or 60 days.
- Cleanup requires confirmation before records are removed.



## Included Technical Foundation

- Fast React-based customer site and admin dashboard.
- Node.js API with a MongoDB database for persistent orders, reservations, users, and messages.
- Real-time order events for staff notifications.
- Email notification capability through the restaurant’s configured email/SMTP account.
- Deployment-ready structure for hosting the public website, admin dashboard, and API separately.



## Client Customisation Checklist

Before launch, the website can be prepared with the client’s:

- Business name and logo
- Brand colours, typography, and imagery
- Restaurant story and homepage content
- Menu categories, dishes, descriptions, prices, and spice options
- Opening hours and reservation schedule
- Address, telephone number, email address, and map/social links
- Customer-facing language content
- Email sender address and restaurant notification address
- External delivery-service links
- Displayed payment methods



## Scope Note

The current ordering flow is designed for **online ordering and collection confirmation**. It records the basket total but does not include an online card-payment gateway. If required, an online payment provider can be added as a separate enhancement. External delivery services are linked to their own platforms rather than managed within this dashboard.

## Future Enhancements

Additional features can be designed and added according to the client’s wishes and business requirements. This can include new customer-facing pages, payment integrations, loyalty programmes, delivery workflows, additional languages, third-party integrations, or custom operational tools.
