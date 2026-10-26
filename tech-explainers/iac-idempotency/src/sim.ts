// IaC idempotency (comment-reply reel): a deterministic model of what each run does to a cloud account.
// A plain script adds servers every run; a declarative tool diffs desired vs actual and applies only the difference.
// Every server tile, count, bill and terminal line comes from that model, timed off the spoken word.
import TL from './timeline.json';
import CAPS from './captions.json';

export const FPS = 30;
export const S = TL;
export const COL = {
  bg: '#0a0e14',
  ink: '#e9eef5',
  dim: '#8b98a9',
  line: '#223044',
  req: '#39d0ff',
  ok: '#3ddc84',
  bad: '#ff4d5e',
  amber: '#ffb020',
  pink: '#ff6fb1',
  violet: '#a98bff',
};

export const word = (id: string, w: string, nth = 0) => {
  const l = CAPS.find((x) => x.id === id);
  const hits = l?.words.filter((x) => x.t.toLowerCase().startsWith(w.toLowerCase())) ?? [];
  if (!hits[nth]) throw new Error(`no word ${w} in ${id}`);
  return Math.round(hits[nth].s);
};

export const A = {
  pipeline: word('hook', 'pipeline'),
  reran: word('hook', 're-ran'),
  and: word('hook', 'and'),
  two: word('hook', 'two'),
  idempotent: word('series', 'idempotent'),
  plain: word('script', 'plain'),
  three: word('script', 'three'),
  twice: word('script', 'twice'),
  six: word('script', 'six'),
  every: word('script', 'every'),
  again: word('script', 'again'),
  terraform: word('declare', 'terraform'),
  exist: word('declare', 'exist'),
  threeTf: word('declare', 'three'),
  steps: word('declare', 'steps'),
  compares: word('diff', 'compares'),
  difference: word('diff', 'difference'),
  already: word('diff', 'already'),
  noChanges: word('diff', 'no'),
  ci: word('why', 'ci'),
  teammates: word('why', 'teammates'),
  crash: word('why', 'crash'),
  safe: word('why', 'safe'),
  deletes: word('drift', 'deletes'),
  next: word('drift', 'next'),
  back: word('drift', 'back'),
  shell: word('catch', 'shell'),
  runs: word('catch', 'runs'),
  everyTime: word('catch', 'every'),
  guard: word('catch', 'guard'),
  doubles: word('catch', 'doubles'),
};

export const PRICE = 60; // ≈ £/month for one t3.medium-class server, on demand

// ── worlds: the cloud account is reset between them ──
export type Server = {name: string; born: number; dies: number; dup: boolean};
const srv = (name: string, born: number, dup = false, dies = Infinity): Server => ({name, born, dies, dup});
export const WORLDS = [
  // the hook: run #1 made web 1–3 yesterday; the 2am retry runs the same script and adds three more
  {from: -Infinity, to: S.script, servers: [srv('web', -999), srv('web', -999), srv('web', -999), srv('web', 12, true), srv('web', 24, true), srv('web', 36, true)]},
  // the plain script, three runs
  {
    from: S.script,
    to: S.declare,
    servers: [
      ...[0, 1, 2].map((k) => srv('web', A.three + k * 5)),
      ...[0, 1, 2].map((k) => srv('web', A.twice + 3 + k * 5, true)),
      ...[0, 1, 2].map((k) => srv('web', A.every + 5 + k * 7, true)),
    ],
  },
  // terraform: desired = 3. First apply adds 3; then nothing; then drift (web-2 deleted by hand) and it puts it back
  {
    from: S.declare,
    to: S.catch,
    servers: [srv('web-1', A.difference - 2), srv('web-2', A.difference + 4, false, A.deletes + 6), srv('web-3', A.difference + 10), srv('web-2', A.back - 2)],
  },
];
export const worldAt = (f: number) => WORLDS.findIndex((w) => f >= w.from && f < w.to);
export const aliveAt = (f: number) => {
  const w = WORLDS[worldAt(f)];
  return w ? w.servers.filter((s) => f >= s.born && f < s.dies) : [];
};
export const DESIRED = 3;

// ── the file in the editor ──
export type CodeFile = {at: number; name: string; lang: string; lines: string[]};
export const FILES: CodeFile[] = [
  {at: -Infinity, name: 'deploy.sh', lang: 'sh', lines: ['#!/bin/sh', 'aws ec2 run-instances \\', '  --count 3 \\', '  --instance-type t3.medium']},
  {at: A.terraform - 4, name: 'main.tf', lang: 'hcl', lines: ['resource "aws_instance" "web" {', '  count         = 3', '  instance_type = "t3.medium"', '}']},
  {at: S.catch, name: 'site.yml', lang: 'yaml', lines: ['- name: add app to PATH', '  shell: echo "export PATH=$PATH:/opt/app"', '         >> ~/.bashrc']},
  {at: A.guard, name: 'site.yml', lang: 'yaml', lines: ['- name: add app to PATH', '  lineinfile:', '    path: ~/.bashrc', '    line: "export PATH=$PATH:/opt/app"']},
];
export const fileAt = (f: number) => [...FILES].reverse().find((x) => f >= x.at)!;

// ── terminal output (the last few lines are shown) ──
export type Out = {at: number; t: string; c?: 'ok' | 'bad' | 'amber' | 'dim' | 'cmd'};
export const OUT: Out[] = [
  {at: -60, t: '# pipeline #1 (yesterday) · 3 servers', c: 'dim'},
  {at: -10, t: '$ ./deploy.sh        # pipeline #2 (auto-retry)', c: 'cmd'},
  {at: 38, t: 'launched 3 instances', c: 'amber'},
  {at: A.two, t: 'servers: 6   wanted: 3', c: 'bad'},
  // script world
  {at: S.script + 2, t: '# new account, same script', c: 'dim'},
  {at: A.three, t: '$ ./deploy.sh   → launched 3 · total 3', c: 'cmd'},
  {at: A.twice + 3, t: '$ ./deploy.sh   → launched 3 · total 6', c: 'amber'},
  {at: A.every + 5, t: '$ ./deploy.sh   → launched 3 · total 9', c: 'bad'},
  // terraform world
  {at: A.terraform, t: '# desired state, not steps', c: 'dim'},
  {at: A.compares, t: '$ terraform apply', c: 'cmd'},
  {at: A.difference - 8, t: 'Plan: 3 to add, 0 to change, 0 to destroy.', c: 'amber'},
  {at: A.difference + 14, t: 'Apply complete! Resources: 3 added.', c: 'ok'},
  {at: A.already, t: '$ terraform apply', c: 'cmd'},
  {at: A.noChanges, t: 'No changes. Your infrastructure matches the configuration.', c: 'ok'},
  {at: A.ci, t: '$ terraform apply   # CI retry      → No changes.', c: 'ok'},
  {at: A.teammates, t: '$ terraform apply   # a teammate    → No changes.', c: 'ok'},
  {at: A.crash, t: '$ terraform apply   # after a crash → No changes.', c: 'ok'},
  {at: A.deletes + 6, t: '! web-2 deleted by hand in the console', c: 'bad'},
  {at: A.next, t: '$ terraform apply', c: 'cmd'},
  {at: A.next + 10, t: 'Plan: 1 to add, 0 to change, 0 to destroy.', c: 'amber'},
  {at: A.back, t: 'Apply complete! Resources: 1 added.', c: 'ok'},
  // ansible
  {at: S.catch + 4, t: '$ ansible-playbook site.yml', c: 'cmd'},
  {at: A.runs, t: 'web-1 : ok=1  changed=1        (run 1)', c: 'amber'},
  {at: A.runs + 12, t: 'web-1 : ok=1  changed=1        (run 2)', c: 'amber'},
  {at: A.everyTime + 4, t: 'web-1 : ok=1  changed=1        (run 3)', c: 'bad'},
  {at: A.guard + 6, t: 'web-2 : ok=1  changed=1   (fresh, run 1)', c: 'amber'},
  {at: A.guard + 18, t: 'web-2 : ok=1  changed=0   (run 2) ✓', c: 'ok'},
  {at: A.guard + 30, t: 'web-2 : ok=1  changed=0   (run 3) ✓', c: 'ok'},
];
// times a run is shown "re-running" (the CI / teammate / crash beats), for the pulse on the cloud panel
export const NO_CHANGE_RUNS = [A.noChanges, A.ci, A.teammates, A.crash];

// ── ~/.bashrc on web-1 in the Ansible beat: a raw shell append adds the line on every run ──
export const PATH_LINE = 'export PATH=$PATH:/opt/app';
// before the guard: web-1 gets one more copy per run. After: a fresh server, web-2, run three times, keeps exactly one
// (lineinfile only adds the line if it's missing; it doesn't clean up copies an earlier shell task left behind)
export const bashrcAt = (f: number) => {
  if (f >= A.guard) return {host: 'web-2', copies: f >= A.guard + 6 ? 1 : 0, guarded: true};
  if (f >= A.everyTime + 4) return {host: 'web-1', copies: 3, guarded: false};
  if (f >= A.runs + 12) return {host: 'web-1', copies: 2, guarded: false};
  return {host: 'web-1', copies: f >= A.runs ? 1 : 0, guarded: false};
};
