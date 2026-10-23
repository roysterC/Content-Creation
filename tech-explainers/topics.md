# Topic backlog: "expert in under 1 minute"

Every episode: **POV hook** → "expert level, in under a minute" card → 4–6 concept scenes → recap → follow. Under 60s.

## Episode log
| # | Topic | Hook | Status | Notes / results |
|---|---|---|---|---|
| 1 | Load balancers | POV: your app just went viral | Rendered (55.1s, male VO) | Round robin, least conn, IP hash, health checks, L4 vs L7 |
| 2 | Caching | POV: your homepage takes 4 seconds to load | Rendered (51.8s, male VO) | Hit/miss, hit rate, TTL (stale price), LRU, cache layers |
| 3 | Rate limiting | POV: one user is hammering your API | v2 draft (57.4s, captions + share ending; v1 rendered 53.5s) | Budget + 429, token bucket, fixed vs sliding window, shared Redis counter, Retry-After |

## Next up (suggested order)
4. **How LLMs work**: *POV: you asked ChatGPT a question* (first AI episode)
5. **DNS**: *POV: you type google.com and press enter*

## Backlog
**System design:** database indexes (*your database just hit a million rows*) · CDNs (*users in Australia say your site is slow*) · message queues (*checkout crashes every Black Friday*) · sharding · read replicas · horizontal vs vertical scaling · microservices vs monolith (*one bug took down your whole app*) · CAP theorem · consistent hashing · idempotency (*your customer got charged twice*)

**Internet:** HTTPS/TLS (*you're on café Wi-Fi typing your password*) · TCP vs UDP (*your video call is lagging*) · WebSockets · what happens when you load a webpage

**Security:** password hashing (*your database just got leaked*) · JWT vs sessions · SQL injection · OAuth (*you clicked "Continue with Google"*) · DDoS

**AI:** RAG (*your chatbot keeps making things up*) · embeddings / vector DBs · AI agents · fine-tuning vs prompting

**Dev workflow:** Git branching · Docker (*"it works on my machine"*) · CI/CD (*you pushed on a Friday at 5pm*)

Mix in an AI episode about every third post.
