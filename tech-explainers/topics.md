# Topic list: "expert in under 1 minute"

**This is the canonical order. Make episodes in list order (next = the first one not done) unless the owner picks another.**

Every episode: **POV hook** → "expert level, in under a minute" line → 5–7 rapid concept beats (each a "but…" twist) → **4-line recap** → loops to frame 0. **No captions**, no follow/share in the video. Under 60s.

## Done before the list
| Topic | Hook | Status |
|---|---|---|
| Load balancers | POV: your app just went viral | Rendered (55.1s, male VO), no captions/share yet |

## Comment replies (one-offs)
| Topic | Hook | Status |
|---|---|---|
| Why IaC must be idempotent (reply to a comment on consistent hashing) | POV: your pipeline re-ran at 2am… and now you're paying for two of every server | ✅ Rendered (54.7s, `iac-idempotency/`: script ×3 → 9 servers; Terraform diff → "No changes"; drift put back; Ansible shell append vs lineinfile). #12 idempotency still to make, general angle (charged twice, idempotency keys) |

## The list
| # | Topic | POV hook | Visual idea | Status |
|---|---|---|---|---|
| **System design** |||||
| 1 | Caching | POV: your homepage takes 4 seconds to load | Requests skip the slow DB and hit the cache; hit vs miss | ✅ Rendered (51.8s) |
| 2 | Database indexes | POV: your database just hit a million rows | Full table scan vs index lookup | ✅ Rendered (48.4s: no recap, follow + share, loop, real timings) |
| 3 | Rate limiting | POV: one user is hammering your API | Token bucket drains/refills, excess bounces with 429 | ✅ v1 rendered (53.5s) · v2 draft with captions + share (57.4s), needs final render |
| 4 | CDNs | POV: your users in Australia say your site is slow | World map, edge servers light up near users | ✅ Rendered (50.6s) |
| 5 | Message queues | POV: tickets drop at 10am… and the page just spins | Orders pile into a queue, workers pull at their own pace | ✅ Rendered (58.0s, ticket drop, new hook → lead → open-loop structure, no end cards) |
| 6 | Database sharding | POV: a hundred million users… and one database is taking every write | One DB splits into shards; id mod 4, range hot spot, hot key + cache, scatter-gather, mod 5 reshard (4 in 5 move) | ✅ Rendered + posted (56.3s, **no captions**: A/B test, rate-limiting style: villain hook + series line + fix at 9s; no end cards, loops; teases #11) |
| 7 | Replication (read replicas) | POV: your database is drowning in reads | Primary takes writes, replicas serve reads, show lag | |
| 8 | Horizontal vs vertical scaling | POV: you need to handle 10x the traffic | One server inflating vs cloning into many | |
| 9 | Microservices vs monolith | POV: one bug just took down your whole app | A block cracking into services | |
| 10 | CAP theorem | POV: the network between your data centres just broke | Pick two of three, visualised | |
| 11 | Consistent hashing | POV: you add one more server to survive the rush… and the whole site gets slower | Cache row: mod 4 → 5 moves 33/40 keys, hit rate crashes; ring from real hashes; add E moves 8/40; B dies → only its 7 keys move; lumpy (C 45%) → 100 vnodes ≈ 25% each | ✅ Rendered (58.1s, no captions, 4-line recap, part 2 of sharding) |
| 12 | Idempotency | **Curiosity hook (new style test):** "Here's what actually happens when you tap Pay twice." | Lost reply → double charge; idempotency key, replay, Stripe header, 409 lock for parallel taps, key must come from the app | ✅ Rendered (53.3s, no captions, 4-line recap; first non-POV hook: compare its 3s hold with the POV episodes) |
| **How the internet works** |||||
| 13 | DNS | POV: you type google.com and press enter | Resolver → root → TLD → nameserver | |
| 14 | HTTPS / TLS | POV: you're on café Wi-Fi typing your password | Handshake + padlock, plain text → scrambled | |
| 15 | TCP vs UDP | POV: your video call is lagging | Ordered packets with acks vs fire-and-forget | |
| 16 | WebSockets | POV: your chat app refreshes every second | Polling vs one open connection | |
| 17 | What happens when you load a webpage | POV: you click a link | The whole journey in 60s | |
| **Security** |||||
| 18 | Password hashing | POV: your database just got leaked | Plain text vs salted hashes | |
| 19 | JWTs vs sessions | POV: you stay logged in for a month | Token vs session cookie | |
| 20 | SQL injection | POV: someone typed a weird name into your login form | The query breaking open, then fixed with parameterised queries | |
| 21 | OAuth | POV: you clicked "Continue with Google" | The redirect dance | |
| 22 | DDoS attacks | POV: a million bots hit your site at once | Pairs with load balancers + rate limiting | |
| **AI** |||||
| 23 | How LLMs work | POV: you just asked ChatGPT a question | Tokens → live next-token probability chart → loop; temperature | |
| 24 | RAG | POV: your chatbot keeps making things up | Retrieve the right docs before answering | |
| 25 | Embeddings / vector databases | POV: you searched "cheap flights" and found "budget airfare" | Words as points in space | |
| 26 | AI agents | POV: your AI just booked your appointment for you | Think → use a tool → check result loop | |
| 27 | Fine-tuning vs prompting | POV: your AI doesn't sound like your brand | | |
| **Dev workflow** |||||
| 28 | Git branching | POV: you and a teammate edited the same file | Branches + a merge conflict | |
| 29 | Docker containers | POV: "it works on my machine" | The app shipped inside its own box | |
| 30 | CI/CD | POV: you pushed on a Friday at 5pm | Pipeline: test → build → deploy → rollback | |

## Notes
- The 23 October one-off on the PHP2Shell vulnerability news was dropped: a safety check blocked it twice, even as a news-only version. Don't retry that topic.
- Results log (add after each post: views, 3s hold, avg watch, saves, shares, where the retention graph drops):
- 25 Oct: owner noticed videos did worse once word-by-word captions were added (rate limiting v1, the 10x outlier, had none). Database sharding is posted **without captions** as a test: compare its 3s hold and avg watch with message queues (captioned). `DbShardingNoCaptions` composition; `<Explainer captions={false}>`.
- 26 Oct: owner's call: **no captions from now on**, and **bring back the 4-line recap** at the end (no follow/share; the recap loops back to the hook). Consistent hashing (#11) made next as part 2 of sharding.
- 27 Oct: owner wants to try new hook styles (curiosity / negative / contrarian / experience / call-out templates) instead of always "POV:". Idempotency (#12) is the first test, with a curiosity hook; everything else unchanged so the hook is the only variable.
