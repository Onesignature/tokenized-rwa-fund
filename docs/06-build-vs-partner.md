# 06 — Build vs Partner

This is a real architectural decision that should be made before locking in the build plan. It does not change the concept; it changes the path to launch.

## The question

Build the on-chain layer proprietary, or partner with one of the established tokenization platforms (Securitize, KAIO, others) to deliver the pilot?

## The two platforms worth evaluating

### Securitize

US-anchored. Global market leader, approximately $4B in tokenized assets (April 2026). Stack of SEC-registered entities (transfer agent, broker-dealer, ATS, exempt reporting adviser, fund administrator). EU operations under the DLT Pilot Regime.

**What Securitize has built that maps to this proposal:**
- KKR Health Care Strategic Growth Fund II (Avalanche)
- Hamilton Lane Equity Opportunities Fund V (Polygon)
- Hamilton Lane SCOPE credit fund (May 2023)
- Hamilton Lane Secondary Fund VI (Polygon, August 2024)
- BlackRock BUIDL (~$2.8B AUM as of late 2025)

All of these are the same structural pattern: tokenized feeder fund subscribes to an institutional fund, issues tokens at much lower minimums than the underlying accepts directly.

**The strategic concern:** US regulatory entanglement. Even with a non-US-domiciled feeder fund, operating through Securitize's ATS, transfer agent, and broker-dealer pulls some of their SEC machinery into the picture. If the operator has explicitly excluded US investors at launch, Securitize partially undoes that decision. Worth a direct conversation; the answer may not be a clean yes.

### KAIO (formerly Libre Capital)

Abu Dhabi-headquartered. Backed by Nomura's Laser Digital, Brevan Howard's WebN Group, Tether, and Shorooq Partners. Rebranded from Libre Capital in July 2025.

**Track record:** ~$100M current AUM, >$500M processed transactions. Tokenized funds from BlackRock, Brevan Howard, Hamilton Lane, and Laser Digital. Recently announced an on-chain fund with a major UAE sovereign wealth arm. Raised $8M led by Tether in April 2026 (total raised ~$19M). Existing partnership with First Abu Dhabi Bank for tokenized collateralized lending — institutional UAE banking rails in place.

**Crucially:** KAIO has already done tokenized hedge fund products (Brevan Howard funds, Laser Carry Fund) in addition to private credit (Hamilton Lane SCOPE) and money market (BUIDL). Closer fit to the operator's profile than Securitize's primarily private-equity book.

**The strategic concern:** KAIO has not tokenized listed equity through an offshore hedge fund wrapper specifically. The structure is adjacent but new for them. Cost unpublished; needs a direct conversation.

## Build vs partner — the trade-offs

|                          | Build proprietary | Partner (Securitize or KAIO) |
|---|---|---|
| **Speed to pilot** | 12–18 months (jurisdiction + smart contracts + audits + banking) | 3–6 months |
| **Upfront capital** | High (legal, audits, build, hires) | Lower (platform fees on AUM) |
| **Ongoing cost** | Lower at scale (no platform fee) | Platform takes a cut of AUM ongoing |
| **Regulatory risk** | Higher (team learning crypto regulation from first principles) | Lower (partner carries the regulatory weight) |
| **Technical risk** | Higher (custom smart contracts, custom audits) | Lower (battle-tested contracts, audits already done) |
| **Structural flexibility** | Full (every economic feature is custom) | Limited (must fit partner's standard templates) |
| **Premium/discount economics** | Achievable by design | Likely not in standard template; may need customization or be lost |
| **Brand and ownership** | Operator owns the brand and the vehicle | Partner co-brands; long-term ownership story less clean |
| **Long-term option value** | High (own brand, own infrastructure, own platform for future products) | Lower (partner brand, harder to exit partnership later) |
| **Credibility at launch** | Built over time | Immediate ("administered by the same firm BlackRock uses") |

## Hybrid options

The decision is not binary.

**Hybrid 1: License technology, own everything else.** License or contract the platform's smart contract stack and transfer agent services, but operate the wrapper through the operator's own jurisdiction, with the operator's own RMs, brand, and bespoke economics. Closer to a software licensing arrangement than a full partnership. Neither platform offers this off the shelf, but both would likely entertain it for the right deal size.

**Hybrid 2: Partner for pilot, build proprietary later.** Launch the pilot through KAIO (or Securitize) to prove the mechanics, gather data on investor demand and operational reality, then build proprietary for the second cycle. Same learn-by-doing approach the operator used with hedge funds.

**Hybrid 3: Evaluate, then decide.** Take meetings with both platforms. Understand pricing, terms, what they will and will not customize. Then make the build-vs-buy call with real information. The downside of having these conversations is essentially zero; the information value is high.

## Where this MVP sits

This MVP is a **proprietary reference implementation**. It is what the on-chain stack would look like if the operator chooses to build rather than partner.

If the operator chooses to partner, this MVP still has value:
- It demonstrates the operator's technical bench depth in negotiations with platforms
- It defines a clear contract: what the operator wants the platform to deliver, expressed in code
- It serves as a fallback option that constrains the platform's pricing power

If the operator chooses to build, this MVP is the starting skeleton — though every component would need to be hardened, audited, and extended before production deployment. See [07-roadmap.md](./07-roadmap.md).

## Recommended next step

Three conversations, two to four weeks:

1. **KAIO** (highest priority): they've done close-to-exactly this, in the operator's preferred jurisdiction, with the operator's preferred investor profile.
2. **Securitize**: still worth talking to as the global leader, with more volume and likely deeper operational learning. The US entanglement question should be answered directly, not assumed.
3. **A peer regional crypto fund operator**: provides a peer perspective on the platform decision, not a vendor pitch.

After those conversations, the build-vs-buy decision falls out naturally.
