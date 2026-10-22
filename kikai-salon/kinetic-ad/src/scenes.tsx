import React from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame} from 'remotion';
import {C, clamp, EASE_IN_OUT, EASE_OUT, SANS, SERIF} from './theme';
import {AWKWARD as AWK, CALL, CTA as CTA_T, DIARY, HOOK, PROBLEM, REVEAL, STATS as STATS_T} from './timing';
import {CheckIcon, Dot, Kinetic, Phone, PhoneIcon, Pill, Sound, usePop} from './ui';

const center: React.CSSProperties = {alignItems: 'center', justifyContent: 'center'};

/* ───────────────────────── 1. HOOK ───────────────────────── */
export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const ringing = frame % 24 < 16 ? 1 : 0;
  const shake = Math.sin(frame * 2.4) * 4 * ringing;
  const punch = interpolate(frame, [HOOK.rings + 4, HOOK.rings + 10], [1, 1.1], {...clamp, easing: EASE_OUT});
  const phoneIn = usePop(-8, 16, 140);

  return (
    <AbsoluteFill style={{background: `radial-gradient(circle at 50% 60%, #26221d 0%, ${C.night} 70%)`, scale: String(punch)}}>
      <Sound src="sfx/ring.wav" at={0} volume={0.22} />
      <Sound src="vo/hook.wav" at={HOOK.voAt} />
      <Sound src="sfx/thud.wav" at={HOOK.rings + 4} volume={0.7} />
      <div style={{position: 'absolute', top: 230, left: 60, right: 60, textAlign: 'center'}}>
        <div style={{display: 'flex', justifyContent: 'center', marginBottom: 26}}>
          <div style={{scale: String(usePop(-6)), opacity: usePop(-6)}}>
            <Pill bg={C.clay} color="#fff" style={{fontSize: 40, fontWeight: 800, letterSpacing: 2}}>
              POV
            </Pill>
          </div>
        </div>
        <Kinetic
          text="you're mid-balayage and the salon phone"
          start={-2}
          stagger={3}
          style={{fontFamily: SANS, fontWeight: 800, fontSize: 78, lineHeight: 1.08, color: '#fff', letterSpacing: -2}}
        />
        <Kinetic
          text="rings."
          start={HOOK.rings}
          style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 170, lineHeight: 1, color: C.clay, marginTop: 6}}
        />
      </div>

      {/* Phone */}
      <AbsoluteFill style={{...center, paddingTop: 720}}>
        <div style={{position: 'relative', translate: `0 ${(1 - phoneIn) * 600}px`, rotate: `${shake}deg`}}>
          {[0, 1, 2].map((i) => {
            const t = ((frame + i * 10) % 30) / 30;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: 330,
                  width: 200,
                  height: 200,
                  translate: '-50% -50%',
                  borderRadius: 999,
                  border: `4px solid ${C.clay}`,
                  scale: String(1 + t * 2.4),
                  opacity: (1 - t) * 0.7,
                }}
              />
            );
          })}
          <Phone width={520} height={980} screen="linear-gradient(180deg,#2a2622 0%,#121110 100%)">
            <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 130, fontFamily: SANS, color: '#fff'}}>
              <div style={{fontSize: 26, color: '#a49c8f', fontWeight: 500}}>Salon line · incoming call</div>
              <div style={{marginTop: 70, width: 150, height: 150, borderRadius: 999, background: '#3a352f', display: 'flex', ...center}}>
                <PhoneIcon size={70} color="#fff" />
              </div>
              <div style={{marginTop: 40, fontSize: 46, fontWeight: 700}}>New client</div>
              <div style={{marginTop: 10, fontSize: 28, color: '#a49c8f'}}>07••• ••4 913</div>
              <div style={{position: 'absolute', bottom: 150, left: 70, right: 70, display: 'flex', justifyContent: 'space-between'}}>
                <div style={{width: 120, height: 120, borderRadius: 999, background: C.red, display: 'flex', ...center}}>
                  <PhoneIcon size={52} color="#fff" rotate={135} />
                </div>
                <div style={{width: 120, height: 120, borderRadius: 999, background: '#34c759', display: 'flex', ...center, scale: String(1 + ringing * 0.06 * Math.sin(frame))}}>
                  <PhoneIcon size={52} color="#fff" />
                </div>
              </div>
            </div>
          </Phone>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ───────────────────────── 2. PROBLEM ───────────────────────── */
const MISSED = ['10:42', '11:15', '12:30', '14:05'];

export const Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const slamAt = PROBLEM.slam;
  const goneAt = PROBLEM.gone;
  const stag = PROBLEM.notifStagger;
  const dim = interpolate(frame, [slamAt - 4, slamAt + 6], [0, 1], {...clamp, easing: EASE_OUT});
  const lastArrival = MISSED.map((_, i) => i * stag).filter((t) => t <= frame).pop() ?? -100;
  const jitter = frame - lastArrival < 6 ? Math.sin(frame * 5) * 10 : 0;
  const glitch = frame >= goneAt + 6 && frame < goneAt + 18 && frame % 3 !== 0;
  const gx = glitch ? (random(`gx${frame}`) - 0.5) * 30 : 0;

  return (
    <AbsoluteFill style={{background: C.night}}>
      {MISSED.map((_, i) => (
        <Sound key={i} src="sfx/thud.wav" at={i * stag + 2} volume={0.45} />
      ))}
      <Sound src="vo/problem1.wav" at={slamAt} />
      <Sound src="vo/problem2.wav" at={goneAt} />
      <Sound src="sfx/thud.wav" at={goneAt + 4} volume={0.9} />
      <AbsoluteFill style={{...center, scale: String(1 - dim * 0.12), filter: `blur(${dim * 14}px)`, opacity: 1 - dim * 0.55}}>
        <div style={{translate: `${jitter}px 0`}}>
          <Phone width={720} height={1360} screen="linear-gradient(180deg,#3b2a22 0%,#15100d 100%)">
            <div style={{position: 'absolute', top: 120, width: '100%', textAlign: 'center', color: '#fff'}}>
              <div style={{fontFamily: SANS, fontSize: 30, fontWeight: 500, opacity: 0.8}}>Saturday</div>
              <div style={{fontFamily: SANS, fontSize: 170, fontWeight: 700, letterSpacing: -6, lineHeight: 1}}>14:06</div>
            </div>
            <div style={{position: 'absolute', top: 430, left: 34, right: 34, display: 'flex', flexDirection: 'column', gap: 18}}>
              {MISSED.map((t, i) => {
                const s = usePop(i * stag, 13, 200);
                return (
                  <div
                    key={t}
                    style={{
                      opacity: Math.min(1, s * 1.4),
                      translate: `0 ${(1 - s) * -60}px`,
                      scale: String(0.9 + 0.1 * s),
                      background: 'rgba(255,255,255,0.16)',
                      borderRadius: 36,
                      padding: '26px 30px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 24,
                      fontFamily: SANS,
                      color: '#fff',
                    }}
                  >
                    <div style={{width: 76, height: 76, borderRadius: 20, background: C.red, display: 'flex', ...center}}>
                      <PhoneIcon size={40} color="#fff" missed />
                    </div>
                    <div style={{flex: 1}}>
                      <div style={{fontSize: 34, fontWeight: 700}}>Missed call</div>
                      <div style={{fontSize: 26, opacity: 0.75}}>Salon line · {t}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Phone>
        </div>
      </AbsoluteFill>

      {frame >= slamAt - 2 ? (
        <AbsoluteFill style={{...center, flexDirection: 'column', padding: 70, textAlign: 'center'}}>
          <Kinetic
            text="Every missed call is a booking"
            start={slamAt}
            stagger={2}
            style={{fontFamily: SANS, fontWeight: 800, fontSize: 92, lineHeight: 1.05, color: '#fff', letterSpacing: -3}}
          />
          <div
            style={{
              fontFamily: SERIF,
              fontStyle: 'italic',
              fontSize: 300,
              lineHeight: 1,
              color: C.red,
              marginTop: 10,
              scale: String(interpolate(frame, [goneAt, goneAt + 6], [2.4, 1], {...clamp, easing: EASE_OUT})),
              opacity: interpolate(frame, [goneAt, goneAt + 3], [0, 1], clamp),
              translate: `${gx}px 0`,
              textShadow: glitch ? `${-gx * 0.6}px 0 #00e5ff, ${gx * 0.6}px 0 #ff00aa` : 'none',
            }}
          >
            gone.
          </div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

/* ───────────────────────── 3. REVEAL ───────────────────────── */
export const Reveal: React.FC = () => {
  const frame = useCurrentFrame();
  const letters = 'Kikai'.split('');
  const underline = interpolate(frame, [REVEAL.line2 + 8, REVEAL.line2 + 24], [0, 1], {...clamp, easing: EASE_IN_OUT});
  const tag = usePop(REVEAL.line2 + 12);
  const meet = usePop(2);

  return (
    <AbsoluteFill style={{background: C.paper, ...center, flexDirection: 'column'}}>
      <Sound src="vo/reveal1.wav" at={REVEAL.voAt} />
      <Sound src="vo/reveal2.wav" at={REVEAL.line2} />
      <div
        style={{
          position: 'absolute',
          width: 900,
          height: 900,
          borderRadius: 999,
          background: `radial-gradient(circle, ${C.clay}33 0%, transparent 65%)`,
          scale: String(0.8 + 0.2 * Math.sin(frame / 20)),
        }}
      />
      <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 52, color: C.muted, opacity: meet, translate: `0 ${(1 - meet) * 30}px`}}>Meet</div>
      <div style={{display: 'flex', overflow: 'hidden', paddingBottom: 20, marginTop: -10}}>
        {letters.map((l, i) => {
          const s = usePop(6 + i * 3, 13, 180);
          return (
            <span key={i} style={{fontFamily: SERIF, fontSize: 340, lineHeight: 1, color: C.ink, display: 'inline-block', translate: `0 ${(1 - s) * 110}%`}}>
              {l}
            </span>
          );
        })}
      </div>
      <div style={{position: 'relative', marginTop: 10}}>
        <Kinetic text="Your new front desk." start={REVEAL.line2} stagger={3} style={{fontFamily: SANS, fontWeight: 700, fontSize: 64, color: C.ink, letterSpacing: -1.5}} />
        <div style={{position: 'absolute', right: 0, bottom: -14, height: 10, width: 330 * underline, background: C.clay, borderRadius: 10}} />
      </div>
      <div style={{marginTop: 80, opacity: tag, scale: String(0.8 + 0.2 * tag)}}>
        <Pill bg={C.ink} color={C.paper}>
          <Dot color={C.clay} /> The AI receptionist for UK salons
        </Pill>
      </div>
    </AbsoluteFill>
  );
};

/* ───────────────────────── 4. CALL DEMO ───────────────────────── */
type Msg = {who: 'caller' | 'kikai'; at: number; len: number; text: string};
const TEXTS: {who: Msg['who']; text: string}[] = [
  {who: 'caller', text: 'Hiya, any chance of a blow dry Saturday afternoon?'},
  {who: 'kikai', text: 'Jess has half past two on Saturday. Shall I pop you in?'},
  {who: 'caller', text: 'Go on then!'},
];
const MSGS: Msg[] = CALL.msgs.map((m, i) => ({...TEXTS[i], at: m.at, len: m.len, id: m.id}));
const TOAST_AT = CALL.toast;

export const CallDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const lift = interpolate(frame, [TOAST_AT - 6, TOAST_AT + 12], [0, -140], {...clamp, easing: EASE_IN_OUT});
  const capOut = interpolate(frame, [TOAST_AT - 6, TOAST_AT + 6], [1, 0], clamp);
  const speaking = MSGS.find((m) => frame >= m.at && frame < m.at + m.len);
  const kikaiTalking = speaking?.who === 'kikai';
  const callerTalking = speaking?.who === 'caller';
  const amp = kikaiTalking ? 1 : callerTalking ? 0.55 : 0.12;
  const toast = usePop(TOAST_AT, 12, 160);

  return (
    <AbsoluteFill style={{background: C.paper2}}>
      <Sound src="vo/callIntro.wav" at={CALL.introAt} />
      {CALL.msgs.map((m) => (
        <Sound key={m.id} src={`vo/${m.id}.wav`} at={m.at} />
      ))}
      <Sound src="sfx/chime.wav" at={TOAST_AT + 2} volume={0.5} />
      <div style={{position: 'absolute', top: 150, width: '100%', textAlign: 'center', opacity: capOut}}>
        <Kinetic text="Tuesday, 9:14pm." start={0} stagger={3} style={{fontFamily: SERIF, fontSize: 110, lineHeight: 1, color: C.ink}} />
        <Kinetic
          text="Salon's shut. Kikai isn't."
          start={CALL.introAt + 2}
          stagger={3}
          style={{fontFamily: SANS, fontWeight: 600, fontSize: 46, color: C.muted, marginTop: 14}}
          wordStyle={(w) => (w === 'Kikai' ? {color: C.clay} : undefined)}
        />
      </div>

      <AbsoluteFill style={{alignItems: 'center', paddingTop: 400, translate: `0 ${lift}px`}}>
        <Phone width={880} height={1300} screen="#ffffff">
          {/* header */}
          <div style={{position: 'absolute', top: 110, left: 50, right: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: SANS}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 14, fontSize: 34, fontWeight: 700, color: C.ink}}>
              <div style={{opacity: 0.6 + 0.4 * Math.sin(frame / 4)}}>
                <Dot color="#34c759" size={20} />
              </div>
              Kikai answered
            </div>
            <div style={{fontSize: 26, fontWeight: 600, color: C.clayDeep, background: '#f6e3db', padding: '10px 20px', borderRadius: 99}}>
              Tue 21:14 · after hours
            </div>
          </div>
          {/* waveform */}
          <div style={{position: 'absolute', top: 190, left: 50, right: 50, height: 100, display: 'flex', alignItems: 'center', gap: 8}}>
            {Array.from({length: 38}).map((_, i) => {
              const h = 10 + amp * (20 + 55 * Math.abs(Math.sin(frame / 3 + i * 0.7) * Math.cos(frame / 5 + i * 0.3)));
              return <div key={i} style={{flex: 1, height: h, borderRadius: 8, background: kikaiTalking ? C.ink : '#c9c3b6'}} />;
            })}
          </div>
          {/* transcript */}
          <div style={{position: 'absolute', top: 330, left: 44, right: 44, display: 'flex', flexDirection: 'column', gap: 22}}>
            {MSGS.map((m, i) => {
              const s = usePop(m.at, 14, 200);
              if (frame < m.at) return null;
              const isK = m.who === 'kikai';
              const shown = isK ? m.text.slice(0, Math.ceil(((frame - m.at) / (m.len - 4)) * m.text.length)) : m.text;
              const typing = isK && shown.length < m.text.length;
              return (
                <div
                  key={i}
                  style={{
                    alignSelf: isK ? 'flex-end' : 'flex-start',
                    maxWidth: '84%',
                    opacity: Math.min(1, s * 1.5),
                    translate: `0 ${(1 - s) * 40}px`,
                    scale: String(0.92 + 0.08 * s),
                    transformOrigin: isK ? 'right bottom' : 'left bottom',
                  }}
                >
                  <div style={{fontFamily: SANS, fontSize: 28, fontWeight: 600, color: C.muted, marginBottom: 8, textAlign: isK ? 'right' : 'left'}}>
                    {isK ? 'Kikai' : 'Caller'}
                  </div>
                  <div
                    style={{
                      fontFamily: SANS,
                      fontSize: 44,
                      lineHeight: 1.3,
                      fontWeight: 500,
                      padding: '24px 30px',
                      borderRadius: 36,
                      borderBottomRightRadius: isK ? 10 : 36,
                      borderBottomLeftRadius: isK ? 36 : 10,
                      background: isK ? C.ink : '#f0ede6',
                      color: isK ? '#fff' : C.ink,
                    }}
                  >
                    {/* invisible full text keeps the bubble size stable while typing */}
                    <span style={{position: 'relative', display: 'inline-block'}}>
                      <span style={{visibility: 'hidden'}}>{m.text}</span>
                      <span style={{position: 'absolute', left: 0, top: 0}}>
                        {shown}
                        {typing ? <span style={{opacity: frame % 8 < 4 ? 1 : 0}}>▍</span> : null}
                      </span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          {/* booked toast */}
          {frame >= TOAST_AT ? (
            <div
              style={{
                position: 'absolute',
                left: 44,
                right: 44,
                top: 1000,
                opacity: Math.min(1, toast * 1.4),
                translate: `0 ${(1 - toast) * 120}px`,
                scale: String(0.85 + 0.15 * toast),
                background: C.sage,
                borderRadius: 40,
                padding: '30px 34px',
                display: 'flex',
                alignItems: 'center',
                gap: 26,
                boxShadow: '0 30px 60px rgba(47,107,79,0.35)',
                fontFamily: SANS,
                color: '#fff',
              }}
            >
              <div style={{width: 92, height: 92, borderRadius: 99, background: '#fff', display: 'flex', ...center}}>
                <CheckIcon size={54} color={C.sage} progress={interpolate(frame, [TOAST_AT + 6, TOAST_AT + 16], [0, 1], clamp)} />
              </div>
              <div>
                <div style={{fontSize: 42, fontWeight: 800}}>Booked · Sat 14:30</div>
                <div style={{fontSize: 30, opacity: 0.9, marginTop: 4}}>Wash &amp; blow dry with Jess · Text sent</div>
              </div>
            </div>
          ) : null}
        </Phone>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ───────────────────────── 5. DIARY ───────────────────────── */
const STAFF = ['Jess', 'Amara', 'Sam', 'Leah'];
const ROW_H = 104;
const START_H = 10;
const BLOCKS: {col: number; from: number; to: number; label: string; color: string}[] = [
  {col: 0, from: 10, to: 12, label: 'Balayage', color: '#f3d9cd'},
  {col: 0, from: 12.5, to: 13.5, label: 'Cut & finish', color: '#e3e8f4'},
  {col: 1, from: 10.5, to: 11.5, label: 'Fringe trim', color: '#e6efe0'},
  {col: 1, from: 13, to: 15, label: 'Full head colour', color: '#f3d9cd'},
  {col: 2, from: 10, to: 11, label: 'Gents cut', color: '#e3e8f4'},
  {col: 2, from: 11.5, to: 13.5, label: 'Highlights', color: '#f6ecc9'},
  {col: 2, from: 15, to: 16, label: 'Blow dry', color: '#e6efe0'},
  {col: 3, from: 11, to: 12, label: 'Toner', color: '#f6ecc9'},
  {col: 3, from: 14, to: 16, label: 'Keratin', color: '#e3e8f4'},
];

export const Diary: React.FC = () => {
  const frame = useCurrentFrame();
  const card = usePop(0, 16, 150);
  const drop = usePop(DIARY.drop, 10, 170);
  const glow = interpolate(frame, [DIARY.drop + 8, DIARY.drop + 24, DIARY.drop + 44], [0, 1, 0.35], clamp);
  const colW = 205;
  const left = 110;

  return (
    <AbsoluteFill style={{background: C.paper, alignItems: 'center'}}>
      <Sound src="vo/diary.wav" at={DIARY.voAt} />
      <Sound src="sfx/thud.wav" at={DIARY.drop + 7} volume={0.5} />
      <div style={{position: 'absolute', top: 170, width: '100%', textAlign: 'center'}}>
        <Kinetic
          text="Straight into the diary."
          start={0}
          stagger={3}
          style={{fontFamily: SERIF, fontSize: 116, lineHeight: 1, color: C.ink}}
          wordStyle={(w) => (w === 'diary.' ? {fontStyle: 'italic', color: C.clay} : undefined)}
        />
        <Kinetic text="Moves, cancellations, text confirmations." start={10} stagger={2} style={{fontFamily: SANS, fontWeight: 600, fontSize: 40, color: C.muted, marginTop: 18}} />
      </div>

      <div
        style={{
          position: 'absolute',
          top: 480,
          width: 960,
          height: 1000,
          background: '#fff',
          borderRadius: 44,
          boxShadow: '0 40px 90px rgba(26,25,22,0.14)',
          opacity: card,
          translate: `0 ${(1 - card) * 200}px`,
          fontFamily: SANS,
          overflow: 'hidden',
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '30px 40px 0'}}>
          <div style={{fontSize: 36, fontWeight: 800, color: C.ink}}>Saturday</div>
          <div style={{fontSize: 26, fontWeight: 600, color: C.muted}}>4 stylists</div>
        </div>
        <div style={{position: 'absolute', top: 100, left, display: 'flex'}}>
          {STAFF.map((s) => (
            <div key={s} style={{width: colW, fontSize: 28, fontWeight: 700, color: C.ink, textAlign: 'center'}}>
              {s}
            </div>
          ))}
        </div>
        <div style={{position: 'absolute', top: 160, left: 0, right: 0}}>
          {Array.from({length: 8}).map((_, i) => (
            <div key={i} style={{position: 'absolute', top: i * ROW_H, left: 0, right: 0, height: ROW_H, borderTop: `2px solid ${C.line}`}}>
              <div style={{position: 'absolute', left: 30, top: 8, fontSize: 22, fontWeight: 600, color: C.muted}}>{START_H + i}:00</div>
            </div>
          ))}
          {BLOCKS.map((b, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: left + b.col * colW + 8,
                width: colW - 16,
                top: (b.from - START_H) * ROW_H + 6,
                height: (b.to - b.from) * ROW_H - 12,
                background: b.color,
                borderRadius: 18,
                padding: '12px 16px',
                fontSize: 24,
                fontWeight: 600,
                color: C.ink,
              }}
            >
              {b.label}
            </div>
          ))}
          {/* the new booking */}
          <div
            style={{
              position: 'absolute',
              left: left + 8,
              width: colW - 16,
              top: (14.5 - START_H) * ROW_H + 6 - (1 - drop) * 500,
              height: ROW_H - 12,
              opacity: Math.min(1, drop * 2),
              background: C.clay,
              borderRadius: 18,
              padding: '10px 12px',
              color: '#fff',
              boxShadow: `0 0 0 ${8 * glow}px ${C.clay}44, 0 20px 40px ${C.clay}55`,
              scale: String(1 + glow * 0.04),
            }}
          >
            <div style={{fontSize: 21, fontWeight: 800}}>14:30 · New</div>
            <div style={{fontSize: 19, fontWeight: 600, whiteSpace: 'nowrap'}}>Wash &amp; blow dry</div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ───────────────────────── 6. AWKWARD ONES ───────────────────────── */
const AWKWARD = [
  {q: 'Can you put me through to Sam?', a: 'Takes a message for a callback.'},
  {q: "I'm pregnant. Is colour safe?", a: 'Passes it to a stylist to ring back.'},
  {q: 'Am I talking to a real person?', a: "Says it's automated. Keeps helping."},
];
export const AWK_BEAT = AWK.beat;

export const Awkward: React.FC = () => {
  const frame = useCurrentFrame();
  const idx = Math.min(AWKWARD.length - 1, Math.floor(frame / AWK_BEAT));
  const f = frame - idx * AWK_BEAT;
  const item = AWKWARD[idx];
  const enter = interpolate(f, [0, 7], [1.3, 1], {...clamp, easing: EASE_OUT});
  const flash = idx > 0 ? interpolate(f, [0, 5], [0.5, 0], clamp) : 0;
  const ans = usePop(idx * AWK_BEAT + 14, 13, 200);

  return (
    <AbsoluteFill style={{background: C.ink}}>
      <Sound src="vo/awkward.wav" at={AWK.voAt} />
      {[1, 2].map((i) => (
        <Sound key={i} src="sfx/thud.wav" at={i * AWK_BEAT} volume={0.4} />
      ))}
      <div style={{position: 'absolute', top: 200, width: '100%', textAlign: 'center'}}>
        <Kinetic text="Hear it handle" start={0} stagger={3} style={{fontFamily: SANS, fontWeight: 600, fontSize: 52, color: '#cfc8bb'}} />
        <Kinetic text="the awkward ones." start={6} stagger={3} style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 130, lineHeight: 1.05, color: C.clay}} />
      </div>

      <AbsoluteFill style={{...center, flexDirection: 'column', paddingTop: 90, paddingLeft: 70, paddingRight: 70}}>
        <div style={{scale: String(enter), textAlign: 'center'}}>
          <div style={{fontFamily: SANS, fontSize: 30, fontWeight: 700, color: '#8f887c', letterSpacing: 4, marginBottom: 26}}>
            CALLER · {idx + 1}/3
          </div>
          <div style={{fontFamily: SERIF, fontSize: 112, lineHeight: 1.05, color: '#fff'}}>“{item.q}”</div>
        </div>
        <div
          style={{
            marginTop: 70,
            opacity: Math.min(1, ans * 1.5),
            translate: `0 ${(1 - ans) * 50}px`,
            scale: String(0.85 + 0.15 * ans),
            display: 'flex',
            alignItems: 'center',
            gap: 22,
            background: C.sageSoft,
            color: C.ink,
            padding: '28px 40px',
            borderRadius: 999,
            fontFamily: SANS,
            fontSize: 42,
            fontWeight: 700,
          }}
        >
          <CheckIcon size={44} color={C.sage} />
          {item.a}
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{background: '#fff', opacity: flash}} />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 7. STATS ───────────────────────── */
const STATS = [
  {big: '24/7', size: 330, label: 'Every call answered. Nights and weekends too.'},
  {big: '5', size: 420, label: 'Channels in one inbox. Calls, WhatsApp, Instagram, Facebook, web chat.'},
  {big: '1 week', size: 260, label: 'From first call to live.'},
  {big: 'Same number', size: 190, label: 'Keep yours. Calls just forward to Kikai.'},
];

export const Stats: React.FC = () => {
  const frame = useCurrentFrame();
  const idx = Math.max(0, STATS_T.beats.findLastIndex((b) => b.at <= frame));
  const f = frame - STATS_T.beats[idx].at;
  const s = STATS[idx];
  const scale = interpolate(f, [0, 6], [2.4, 1], {...clamp, easing: EASE_OUT});
  const blur = interpolate(f, [0, 6], [30, 0], clamp);
  const shake = f >= 6 && f < 12 ? Math.sin(f * 4) * (12 - f) * 2 : 0;
  const label = interpolate(f, [5, 11], [0, 1], {...clamp, easing: EASE_OUT});

  return (
    <AbsoluteFill style={{background: C.clay, ...center, flexDirection: 'column', padding: 80, textAlign: 'center'}}>
      {STATS_T.beats.map((b) => (
        <React.Fragment key={b.id}>
          <Sound src="sfx/thud.wav" at={b.at} volume={0.6} />
          <Sound src={`vo/${b.id}.wav`} at={b.at + 2} />
        </React.Fragment>
      ))}
      <div style={{position: 'absolute', top: 250, display: 'flex', gap: 16}}>
        {STATS.map((_, i) => (
          <div key={i} style={{width: i === idx ? 60 : 18, height: 18, borderRadius: 99, background: i <= idx ? '#fff' : '#ffffff55'}} />
        ))}
      </div>
      <div style={{fontFamily: SERIF, fontSize: s.size, lineHeight: 0.95, color: '#fff', scale: String(scale), filter: `blur(${blur}px)`, translate: `${shake}px 0`}}>
        {s.big}
      </div>
      <div style={{marginTop: 40, fontFamily: SANS, fontWeight: 700, fontSize: 52, lineHeight: 1.2, color: '#fff6f0', opacity: label, translate: `0 ${(1 - label) * 30}px`, maxWidth: 860}}>
        {s.label}
      </div>
    </AbsoluteFill>
  );
};

/* ───────────────────────── 8. CTA ───────────────────────── */
export const CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const btn = usePop(CTA_T.l3, 11, 170);
  const pulse = frame > CTA_T.l3 + 16 ? 1 + 0.035 * Math.sin((frame - CTA_T.l3 - 16) / 4) : 1;
  const url = usePop(CTA_T.l3 + 10);
  const meta = usePop(CTA_T.l3 + 18);
  const mark = usePop(CTA_T.l3 - 8);

  return (
    <AbsoluteFill style={{background: C.paper, ...center, flexDirection: 'column', textAlign: 'center'}}>
      <Sound src="vo/cta1.wav" at={CTA_T.l1} />
      <Sound src="vo/cta2.wav" at={CTA_T.l2} />
      <Sound src="vo/cta3.wav" at={CTA_T.l3} />
      <Sound src="sfx/chime.wav" at={CTA_T.l3 + 2} volume={0.3} />
      <div
        style={{
          position: 'absolute',
          width: 1100,
          height: 1100,
          borderRadius: 999,
          background: `radial-gradient(circle, ${C.clay}26 0%, transparent 62%)`,
          scale: String(0.9 + 0.1 * Math.sin(frame / 18)),
        }}
      />
      <Kinetic text="Hands full." start={0} style={{fontFamily: SERIF, fontSize: 190, lineHeight: 1, color: C.ink}} />
      <Kinetic text="Still booked." start={CTA_T.l2} style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 190, lineHeight: 1, color: C.clay}} />

      <div style={{marginTop: 90, display: 'flex', alignItems: 'center', gap: 16, opacity: mark, translate: `0 ${(1 - mark) * 30}px`}}>
        <div style={{width: 64, height: 64, borderRadius: 18, background: C.ink, display: 'flex', ...center}}>
          <PhoneIcon size={34} color={C.paper} />
        </div>
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 64, letterSpacing: -2, color: C.ink}}>kikai</div>
      </div>

      <div
        style={{
          marginTop: 56,
          opacity: Math.min(1, btn * 1.4),
          scale: String((0.6 + 0.4 * btn) * pulse),
          background: C.ink,
          color: '#fff',
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: 50,
          padding: '34px 70px',
          borderRadius: 999,
          boxShadow: '0 24px 50px rgba(26,25,22,0.25)',
        }}
      >
        Get Kikai →
      </div>
      <div style={{marginTop: 34, fontFamily: SANS, fontWeight: 600, fontSize: 40, color: C.ink, opacity: url}}>kikaiagency.vercel.app</div>
      <div style={{marginTop: 14, fontFamily: SANS, fontWeight: 500, fontSize: 32, color: C.muted, opacity: meta}}>
        Live in a week · Keep your number
      </div>
    </AbsoluteFill>
  );
};
