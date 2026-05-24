---
title: "Beyond Excel"
lede: "Last December I inherited a half-built ERP. The sales side was written in ASP.NET + C# + MS SQL; the production side was on the plan but not in code. I moved it onto a modern Laravel stack and wove the production chain from scratch. I've been at it for four and a half months and it still isn't done. What the field taught me, here."
metaDescription: "I inherited a half-built ERP: migrated it from ASP.NET to Laravel, wove the production chain from scratch. Four and a half months of notes from the field."
date: 2026-04-28
tags: [erp, production, field, infrastructure]
docNumber: 2
lang: en
translations:
  tr: excelin-bittigi-yer
---

I write internal tools for production and operations companies. The project that gets most of my time is the ERP/MES platform of the industrial business I work inside. This post isn't about a system I built from scratch; it's a note on a system that landed in my hands half-built, that I migrated, wove on top of, and am still weaving. Four and a half months had built up.

## The old life: Excel + WhatsApp + paper

Before the system arrived, three tools ran in parallel at the factory. The sales team kept orders and reports in **Excel** files. **Paper forms** were used for order notifications, production reports, and shipping slips. The production team filled out the production reports, the shipping team filled out the shipping slips. Communication between units flowed over **WhatsApp**, in groups.

From the outside this setup looks "handmade," but inside there were two large cracks.

The first was the necessity of **writing the same information into two separate places**. When sales opened an order, its details had to be copied verbatim over to the shipping side; inside production, the same data scattered across different records. Two people opening the same file at the same time and one overwriting the other was a typical case.

The second was harsher. A board came out of production, went to **sizing, then to puttying, sanding, and finally to the film press**. A five-link chain. When you asked *"which machine is this part on right now?"* — in the old system, no one knew. The production manager? The sizing operator? The press operator? No one, because there was no systematic record anyone was responsible for. Either you remembered, or you got up and went to look yourself.

On top of a data map this scattered, there was no way of picking up the customer's call and answering *"okay, yours is on sanding right now."*

## The system I inherited: a half-scoped spec

In December 2025 I received a package. Inside was an ERP written in **ASP.NET Core 9 + C# + MS SQL Server 2016**, a seventy-four-page feature spec document, and screen designs. The system's scope was cleanly defined: customer management, products (parametric pricing + manual products), quote lifecycle, work orders, multi-currency (daily rates from the TCMB API), multi-company (host-tenant data separation), roles and permissions, dashboard, platform settings.

So the **sales side** was complete. The part from taking a quote from a customer, pricing the product against its parameters, versioning the quote, and turning it into a work order once approved — all that was written.

The spec's own sentence was clear:

> *"this proposal system is intended as the very first part of a much larger ERP system that is being planned. It can be taught as the first module of a complete ERP system, which can be used to manage the entire plywood factory's production and other operations."*

In other words: on the plan, not in code. Up until the work order is issued, things were systematic. After that — production, sizing, shipping, stock, lot tracking, labeling — on the field, it was still Excel + WhatsApp + paper.

The decision took shape here.

## The migration decision: why Laravel + PHP + MySQL

Continuing on the existing C# stack and just adding the new modules was an option too. But three cost items vanished at once, so the decision was easy:

- **No licenses.** MS SQL Server and Windows Server licenses were a permanent line in the budget. PHP, MySQL, Linux are free.
- **The server was already set up.** I had my own Linux server; Caddy for the reverse proxy, Tailscale for the private network, Docker for the services. There was no need to stand up an extra Windows server.
- **The person on the development line was me.** If a software team had been hired, every feature request would have meant a man-hour cost. If I did it, that line dropped out of the budget too, because the person on that line was me.

With three cost items gone at once, choosing to move from ASP.NET Core 9 to **Laravel 12 + PHP 8.3 + MySQL** made sense. The frontend was already HTML 5 + CSS 3 + JavaScript; that stack didn't change. I rewrote the equivalent with the Blade template engine + Alpine.js + TailwindCSS.

The first few months were almost entirely **port work**: reading the C# code line by line and writing the PHP/Laravel code that did the same job. Customers, products, parametric pricing, quote lifecycle, work orders, multi-tenant data separation, multi-currency, snapshot versioning — all of it was in the spec, and I ported all of it one by one.

## What I wove on top

The interesting part really began after the port: adding the production chain that wasn't in the spec.

The first module was **production planning**. I started there on purpose, because it was the head of the chain; all the next steps (sizing, puttying, sanding, film press) would feed off production. Then I wove the field chain link by link:

- **Sizing:** machine assignments, work-day planning, in/out tracking
- **Puttying:** work pool, completion record, waste/scrap tracking
- **Sanding:** status pool, volume calculation (m³)
- **Film press:** press definition, slot configuration, film-sheet planning, daily log

Around all of that came the **lot tracking** system. Each piece's unique number, which stage it's at, who's responsible, when it passed through. To that I added **labeling + QR + TSPL printer** integration; now a board gets labeled as it comes out of production and stays scannable all the way through the field. Then **stock**, **shipping**, **export documents** (ATR, EUR.1, invoice, waybill), tenant-specific order statuses, **pessimistic locking** on production updates: so two people writing to the same row don't fall into a race condition.

My method wasn't sprint discipline. **I write scenarios day by day**: *"in this scene the operator does this, the system records that, this calculation runs."* Then I go down to the field, get the teams to use it, collect their feedback, fix the bugs, and ship it again. So there's no closing modules in sequence and leaving them behind; I keep coming back on top of most of them.

## The two lessons the field taught me

There are two lessons, without which the platform — even a "million-dollar" one — goes in the bin.

### "If the first input is wrong, the chain is rotten"

However elegant the system is, if the **raw data is entered wrong**, the report at the end of the chain is wrong too. The most obvious version of this showed up here: a lot recorded as `100 units` at the production exit gets verified as `95 units` when it arrives at sizing. The 5 in between are ghosts; they wander inside the system, they're in the report, they're not on the field.

Hardening against this is the topic I'm actively working on right now. **You have to model the variables ahead of time and enforce them at the raw input step.** Who entered it, when, under what conditions, based on what? I hadn't noticed any of this during the system design; I learned it by going to the field and back, again and again.

The GIGO classic — *garbage in, garbage out* — is a textbook sentence. The field's version is much harsher: the software charges you for the second half of the sentence; the person on the field charges you for the first half.

### "Convincing the user isn't a technical question"

The system is ready, the screen works, the buttons are in place. The operator still wants to write into Excel. Because Excel is the file he's kept for years; opening it is reflex. Your system is new, unfamiliar, a screen layout he doesn't get.

If the field team isn't **willing and accountable**, the system rots all the same. The software can be good, the training can be done, but if one or two people say *"I'm going to keep tracking it in Excel,"* the chain breaks. Because once a single link in the chain stops keeping records, the report you can look back at isn't honest.

This isn't a problem you solve by writing code. UX improvements solve part of it (make it easier to use than Excel); the rest depends on the team's decision and the manager's stance.

## Being the developer and the end user at the same time

Not a usual combination. I write an ERP and, at the same time, use it as the person responsible for sales and shipping.

The advantage is clear: when reading the spec I don't think *"how would the sales lead behave,"* I think *"as the sales lead, what do I want right now?"* [I'm in my 11th year in the industry](/). How a quote is opened, the routes a container takes from Turkey to wherever it goes, how freight cost is calculated, what the customer asks on the phone — the screen comes to me already built in my head. That's a context an outside developer can never have.

But there's a price to this, and I have to be honest.

**First risk: this isn't my main job.** Sales and shipping are the main job; software is the side. So there's no sprint discipline. I add a piece when I feel like it, on another day I don't touch it at all. I can't make a *"this will take two weeks"* plan for an important feature, because two weeks of workdays are already booked for the sales work.

**Second risk: no opposing view.** When you use what you've written, your *"it would be better if it were like this"* thought is closed off from the outside developer's *"who's using this, does this person actually think this way?"* check. Some of my software decisions might be off, because I work without discipline. Since I'm the only one who knows, there's no outside eye to say so either.

This post is, in part, a note against that blindness.

## Closing

Without data integrity, however elegantly you've designed your "million-dollar" software, it ends up in the bin. If the field team doesn't feel accountable, the system rots all the same. Those two sentences are the hardest thing four and a half months have taught me, looking back.

There's no *"done."* Maybe it goes on like this for another year, maybe three. Weaving the system, testing it on the field, the user habits shifting, the *"first input"* discipline settling in — none of these are work with a release date. You finish the software, the feedback comes back from the field, you go back and fix it. Then again.

Maybe the main lesson is this: writing a factory isn't a one-time job. It's an ongoing, field-embedded, permanent relationship. I wrote about the independent warehouse system I wove alongside this one in the post [*A timber's diary*](/blog/the-lumber-log).
