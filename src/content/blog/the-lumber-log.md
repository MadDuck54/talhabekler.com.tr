---
title: "A timber's diary"
lede: "While building the ERP described in the previous post, I came to realize that some jobs are jobs of their own systems. When timber imports started, this became concrete: tracking hundreds of raw materials at the unit level, measuring with handheld terminals, following them with QR codes — a separate warehouse system that needed to be built from scratch. This post tells the story of a single piece of timber, from the moment it lands at the yard to the moment it climbs onto a customer's truck, along with the software decisions I made along the way."
metaDescription: "From container to customer's truck: a timber WMS built from scratch with handhelds, QR, PWA. Software, hardware and field-flow decisions."
date: 2026-04-28
tags: [warehouse, wms, pwa, field]
docNumber: 3
lang: en
translations:
  tr: kerestenin-gunlugu
---

In the previous post, I described how I migrated an inherited ERP onto a modern stack and, on top of that, wove the missing production chain on the field from scratch. This post is a sequel of sorts, because there's something I understood while building that ERP: some jobs are not the ERP's job. This project was born out of that realization.

## "You can't fit this into the ERP"

While building the ERP, I kept asking myself the same question: which work belongs inside it, and which belongs to its own application? Because when you try to pile everything into a single system, either the system gets bloated or the usability falls apart. There were areas on the field still being managed with Excel and WhatsApp; I was uneasy about not touching them, but cramming all of them into the ERP wasn't right either.

Then a new line of business emerged at the factory: timber imports. Previously, we'd been buying raw material from various suppliers built on years of relationships. Timber imports were something else: heavy volume, sizable quantities, a business whose details we mostly didn't know. A container would arrive in Turkey by ship, get unloaded at the warehouse, with the raw timber inside sitting on shelves for days or months, and then be sold to customers piece by piece or by the pallet.

At first I considered adding it to the ERP as a module. But the more I thought about it, the harder it got to insist: that ERP was a quote/order ERP. The timber in the warehouse, on the other hand, was raw material that needed to be measured, labeled, and tracked at the unit level until it was sold — hundreds of pieces of it. A field-heavy flow like that inside the ERP would have blurred the system's center of gravity. There was a stack mismatch too: the ERP was built on Blade + Alpine + MySQL, and what I'd be building here was Vue + Inertia + Postgres + PWA. Field devices, offline operation, talking to a label printer directly over TCP — those are features of a different application.

The decision to write it from scratch, separately, and again on my own came easily. Software cost was the main reason, again.

## First encounter with the device world

Before the software decision, there was a fear: handheld terminals. Field devices were a world I knew nothing about.

I ordered a test device. A cheap Chinese Android handheld with a crookedly glued cover. I spent two nights wrestling with it. How does barcode scanning work, how does the system detect the device, how does the screen behave, which browser does it use. I realized it was more or less a standard Android device, just with a rugged case, a trigger button, and a laser scanner on it.

That was a relief, but at the same time it surfaced a new fear: if it's Android, I'd have to write the application as an APK. I had zero Android experience. What's an APK, what language is it written in, what DB does it use, how do you deploy it — I had no idea. *"How am I going to pull this off?"* was a real moment for me.

The solution was actually hidden in the application's background: I didn't have to write a native APK. For the warehouse tracking app, something running in a web browser would suffice; the Chrome on the handheld would run Vue just fine. On top of that I added PWA (manifest, service worker, offline cache), which still gives the user the "app" feel. Fullscreen on launch, offline operation, addable to the home screen.

So my PWA choice wasn't "let's try a modern technology." It was a maneuver to pull an unfamiliar area (Android native) into a familiar one (web). Will the user notice? No. Will it benefit me? Hugely.

Our current field device is the Zebra TC21, a professional Android handheld. The label printer side fell into place in two steps too: we first tried a small portable Zebra ZPL 320, but the connection was unreliable and the label size was insufficient. We switched to a TSC TE210 (203 dpi, 70×50 mm). Efficient, problem-free, still in use. We talk to the printer directly over a TCP socket on port 9100; the server generates TSPL2 commands and prints Turkish characters cleanly with code page 1254.

## Full pallet, or piecemeal?

When I started building the system, there was a deliberate design decision: we never break a pallet. The customer buys a pallet; we don't sell retail. This would both make things easier operationally and keep the system simple — there'd be no need for an extra state machine to track things at the unit level.

But a corner of my mind kept coming back to the same question: *what if someone breaks open a pallet and asks for individual pieces — how do we track what's left?*

Eventually that question demanded an answer. I designed the system so it could track all the way down to the unit: the pallet QR stays fixed, but the state of the timber inside it (`in stock` / `reserved` / `sold`) is carried in JSON data. Once a handheld scans a pallet, the system can now say: *"This pallet was opened, 3 pieces from it were sold to this customer, 7 pieces remain."*

The concrete payoff of this decision will show up in the next section: the field flow for unit-level sales was built around this evolution.

The scenarios were tested; I can't see any holes. But whether something I missed will surface in real life — I don't know. We'll see in time.

## A timber's journey

The best way to describe what the system does is through a single piece of timber.

Days before the container arrives in Turkey, the supplier sends a packing list — a breakdown of *"this container has timber of these dimensions, of these grades, in these quantities."* We upload the PDF into the system; the goods receipt user opens it on the handheld and gets a preview of what's coming. It's a small detail, but it makes a big difference on the field: the user starts forming a picture of the product before the container even arrives. Without it, every time he'd have to call the office to ask "what's coming again?"

Once the container is unloaded, the goods receipt process begins. The user taps *"receive goods"* on the handheld:

1. He picks the date and confirms.
2. He selects the supplier. There's a deliberate design decision here: the system doesn't show him all suppliers — only those whose **purchases have been made and are due for delivery soon**. With dozens of suppliers side by side in a list, the user could accidentally pick the wrong one; by narrowing the list, I drive that error rate to zero.
3. Product and grade are selected.
4. The system asks a question: *"Are the length and thickness of the timber you're going to enter the same?"* If all the timber on the pallet has the same thickness × length, he says "yes," the system takes those two common values once, and from then on only asks for the **width** of each piece. Otherwise, each piece must be entered with all three values. This cuts the amount of work done on the handheld to roughly a third — and more importantly, it proves to the user that the handheld isn't grinding him down.
5. The user measures each piece one by one: 10×20×400, 10×10×300… The system automatically computes the cubic meters of each (six decimal places, because the m³ difference looks small, but accumulates as the lot grows).
6. When the pallet is done, he taps *"close pallet."* At that moment the system triggers the printer: the pallet QR code, plus an individual QR code for every piece in it, **all come out of the printer one after another in a single shot**.
7. The user sticks each label on its piece, sticks the pallet label on the pallet, and the pallet enters stock.

Same flow for the next pallet. Until the container is empty.

Months later, a buyer asks for timber. A sales order is opened in the office. A notification lands on the handheld. The user on the field opens the order and starts confirming the physical shipment.

For full-pallet sales, the flow is simple: he scans the pallet QR, and the system marks every piece on that pallet as *"sold"* in one go. For unit-level sales, I built an elegant verification flow: first the pallet is scanned. The system checks that this is actually the pallet that's supposed to be sold; if it's wrong, it throws an error to the user, and scanning starts over until the right pallet is found. Once the correct pallet is opened, the pieces inside become selectable for the user; he marks the pieces to be sold by scanning them one by one. The system won't close the shipment until verification is complete.

The only reason I put this logic in is one thing: to drive the risk of selling the wrong piece from the wrong pallet to zero. The field is dim, tired, distractions are everywhere; the system has to block the mistake even when attention slips.

## The developer's mind and the field's mind are the same mind

In the previous post I'd written: *"I don't think 'how would the sales lead behave,' I think 'as the sales lead, what do I want right now?'"* In this project I lived through the conditions where I actually had to put that thesis into practice.

The system's design didn't come to me from someone outside. The packing list idea, narrowing the supplier list during goods receipt, the *"are length and thickness the same?"* question, the pallet verification logic — none of it came to me from *"let's ask the salesperson,"* *"let's ask the warehouse guy,"* *"let's ask the developer."* I found all of it on my own, by running my own scenarios, by letting my own experience speak.

While doing this, I felt almost split, honestly.

I went down to the field, took the terminal in my hand, and actually received goods. I pulled out my laptop, checked the system, saw the gaps. I measured timber dozens of times, lived through a goods receipt from start to finish. Whenever I found a flow that made a user's job harder, I thought it through, solved it, tested it, fixed the gaps, analyzed the bugs, and coded it again. Then I went back down to the field.

What I'm trying to say is this: I was the one taking the goods, the one receiving them, the one selling them. I programmed myself as every part of the system. Until I had the right data.

This is a quiet but powerful mode of writing software. If another developer had built this project, he'd have to go to the field, talk to the user, learn the loop, come back to the desk and try to code, then come back a week later saying *"this didn't work."* I was writing the code while standing inside the loop; the latency between them was zero.

That's also why I never had a *"I thought like a developer, but it doesn't work that way on the field"* moment in this project. I'd had plenty of those in the previous post; there, someone else's decisions had been pushed onto me, and I had to go through the experience phase. Here, every decision was the result of a remembered goods-receipt moment or a sales-call scene.

## What I still haven't solved

Even so, there's one open problem, to be honest.

At goods receipt, measuring each piece of timber one by one is still bound to human labor. A user picks up a piece, opens the tape measure, enters the thickness, width, and length values into the handheld one at a time. With hundreds of pieces, that's a multi-hour job, and fatigue turns into measurement error. The system feeds off this raw data both at the very beginning and at the very end; in other words, the lesson *"if the first input is wrong, the chain is rotten"* from the previous post applies here too, but the trigger is different: a wrong value entered out of fatigue causes the system to carry the wrong cubic meters forever.

The solution in my head is pallet-level measurement. The global practice points that way: instead of measuring each piece with a tape, measuring the entire pallet as a whole and computing its total volume. I haven't moved there yet, but that's the direction.

## Closing

Somewhere in this post I wrote the line: *"If multiple suppliers' goods arrive in the same period in the future, things might get tangled — for now, it's an open issue."* I noticed that line while writing the post. It hadn't occurred to me before.

In the closing of the previous post I'd said, *"this post is, in a way, a note against that blindness."* Here's a real-time piece of evidence: writing is a thinking tool, not just a record. Sitting under a section, sequencing the flow, a gap in the system I hadn't noticed before suddenly surfaces. I jot it down on the side of the file.

Maybe blogging is, in the long run, a development tool that feeds the system, not just a way to broadcast it. I'll keep testing this for a while.

This system is still growing. There's still no *"done."* The next step will probably be moving to pallet-level measurement. For now: human hand, tape measure, terminal screen.
