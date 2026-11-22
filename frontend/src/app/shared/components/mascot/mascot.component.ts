import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type MascotExpression = 'happy' | 'excited' | 'tired' | 'curious' | 'surprised' | 'sad' | 'peeking';

@Component({
  selector: 'app-mascot',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="mascot-wrapper"
      [class.animated]="animated"
      [class.interactive]="interactive"
      [style.width.px]="numericSize"
      [style.height.px]="expression === 'peeking' ? numericSize * 0.78 : numericSize"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        [attr.viewBox]="expression === 'peeking' ? '0 14 160 110' : '0 0 160 160'"
        width="100%"
        height="100%"
        class="mascot-svg"
      >
        <defs>
          <!-- ── Ball body gradient: upper-left highlight → midtone → deep shadow ── -->
          <radialGradient id="ballGrad" cx="38%" cy="30%" r="68%" fx="38%" fy="30%">
            <stop offset="0%"   stop-color="#E8E0FF"/>
            <stop offset="30%"  stop-color="#D1C4F2"/>
            <stop offset="62%"  stop-color="#B9A7E8"/>
            <stop offset="88%"  stop-color="#9680D0"/>
            <stop offset="100%" stop-color="#7B64B8"/>
          </radialGradient>

          <!-- ── Specular highlight on the ball ── -->
          <radialGradient id="specular" cx="35%" cy="28%" r="30%">
            <stop offset="0%"  stop-color="#FFFFFF" stop-opacity="0.55"/>
            <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
          </radialGradient>

          <!-- ── Blush gradient ── -->
          <radialGradient id="blushL" cx="50%" cy="50%" r="50%">
            <stop offset="0%"  stop-color="#F3DCE8" stop-opacity="0.90"/>
            <stop offset="70%" stop-color="#F3DCE8" stop-opacity="0.45"/>
            <stop offset="100%" stop-color="#F3DCE8" stop-opacity="0"/>
          </radialGradient>
          <radialGradient id="blushR" cx="50%" cy="50%" r="50%">
            <stop offset="0%"  stop-color="#F3DCE8" stop-opacity="0.90"/>
            <stop offset="70%" stop-color="#F3DCE8" stop-opacity="0.45"/>
            <stop offset="100%" stop-color="#F3DCE8" stop-opacity="0"/>
          </radialGradient>

          <!-- ── Drop shadow filter ── -->
          <filter id="shadow" x="-15%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#3A2D5A" flood-opacity="0.22"/>
          </filter>

          <!-- ── Soft glow for tears ── -->
          <filter id="tearGlow">
            <feGaussianBlur stdDeviation="1" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>

          <!-- ── Ball clip path (for yarn texture) ── -->
          <clipPath id="ballClip">
            <ellipse cx="80" cy="93" rx="58" ry="55"/>
          </clipPath>
        </defs>

        <!-- ═══════════════════════════════════════════
             GROUND SHADOW
        ═══════════════════════════════════════════ -->
        <ellipse *ngIf="expression !== 'peeking'" cx="80" cy="150" rx="42" ry="6" fill="#40345F" opacity="0.13"/>

        <!-- ═══════════════════════════════════════════
             TOP CURLY YARN STRAND
             Double-loop curl: rises, loops clockwise, trails right
        ═══════════════════════════════════════════ -->
        <g class="curly-strand" [class.droopy]="expression === 'tired'">
          <ng-container *ngIf="expression !== 'tired'">
            <!-- Base stroke (dark purple) -->
            <path
              d="M 76,44
                 C 76,26  84,12  96,14
                 C 108,16  110,30  100,36
                 C 92,40   92,50  104,52
                 C 114,54  126,42  132,44"
              fill="none" stroke="#7B64B8" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/>
            <!-- Highlight stripe -->
            <path
              d="M 76,44
                 C 76,26  84,12  96,14
                 C 108,16  110,30  100,36
                 C 92,40   92,50  104,52
                 C 114,54  126,42  132,44"
              fill="none" stroke="#E0D8FF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
              stroke-dasharray="4 6"/>
          </ng-container>

          <!-- Droopy tired strand -->
          <ng-container *ngIf="expression === 'tired'">
            <path
              d="M 76,44
                 C 78,32  82,28  92,30
                 C 100,32  100,46  104,54
                 C 108,62  116,66  126,66"
              fill="none" stroke="#7B64B8" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
            <path
              d="M 76,44
                 C 78,32  82,28  92,30
                 C 100,32  100,46  104,54
                 C 108,62  116,66  126,66"
              fill="none" stroke="#E0D8FF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"
              stroke-dasharray="4 7"/>
          </ng-container>
        </g>

        <!-- ═══════════════════════════════════════════
             MAIN BALL BODY
        ═══════════════════════════════════════════ -->
        <ellipse cx="80" cy="93" rx="58" ry="55" fill="url(#ballGrad)" filter="url(#shadow)"/>

        <!-- ═══════════════════════════════════════════
             YARN WOUND TEXTURE  (clipped to ball)
             Strands wrap around the spherical contour like
             latitude / longitude lines on a globe.
        ═══════════════════════════════════════════ -->
        <g clip-path="url(#ballClip)" fill="none" stroke-linecap="round">

          <!-- Strand 1 — upper diagonal wrap (top-left → upper-right) -->
          <path d="M 32,62  C 50,46  110,50  132,72"
                stroke="#8C74C4" stroke-width="6.5" opacity="0.80"/>
          <path d="M 33,61  C 51,45  111,49  131,71"
                stroke="#D8CFFF" stroke-width="2.4" opacity="0.90"/>

          <!-- Strand 2 — upper-mid sweep -->
          <path d="M 24,76  C 44,60  116,60  140,82"
                stroke="#8C74C4" stroke-width="5.5" opacity="0.70"/>
          <path d="M 25,75  C 45,59  117,59  139,81"
                stroke="#D8CFFF" stroke-width="2"   opacity="0.80"/>

          <!-- Strand 3 — mid-upper (barely above eyes) -->
          <path d="M 22,90  C 40,74  118,76  142,94"
                stroke="#8268BD" stroke-width="5"   opacity="0.65"/>

          <!-- Strand 4 — mid-lower (below eyes, above mouth) -->
          <path d="M 22,106 C 44,96  116,96  142,110"
                stroke="#8268BD" stroke-width="5.5" opacity="0.72"/>
          <path d="M 23,105 C 45,95  117,95  141,109"
                stroke="#C8BFEE" stroke-width="2"   opacity="0.75"/>

          <!-- Strand 5 — lower sweep -->
          <path d="M 24,120 C 48,114  116,114  138,122"
                stroke="#7A62B4" stroke-width="6"   opacity="0.78"/>
          <path d="M 25,119 C 49,113  117,113  137,121"
                stroke="#C8BFEE" stroke-width="2.2" opacity="0.80"/>

          <!-- Strand 6 — bottom curve -->
          <path d="M 32,132 C 56,138  104,138  130,130"
                stroke="#7055AA" stroke-width="5.5" opacity="0.74"/>

          <!-- Left-side vertical wrap -->
          <path d="M 30,56  C 20,76  22,112  34,134"
                stroke="#8C74C4" stroke-width="4.5" opacity="0.55"/>

          <!-- Right-side vertical wrap -->
          <path d="M 128,58 C 140,78  138,112  124,134"
                stroke="#8C74C4" stroke-width="4.5" opacity="0.55"/>

          <!-- Extra center cross-strand for texture depth -->
          <path d="M 56,42  C 72,36  96,38  112,50"
                stroke="#9A85D2" stroke-width="4"   opacity="0.50"/>
        </g>

        <!-- ═══════════════════════════════════════════
             SPECULAR SHINE on top of yarn
        ═══════════════════════════════════════════ -->
        <ellipse cx="80" cy="93" rx="58" ry="55" fill="url(#specular)"/>

        <!-- ═══════════════════════════════════════════
             BLUSH CHEEKS  (always visible)
        ═══════════════════════════════════════════ -->
        <ellipse cx="42"  cy="104" rx="10" ry="7" fill="url(#blushL)"/>
        <ellipse cx="118" cy="104" rx="10" ry="7" fill="url(#blushR)"/>


        <!-- ══════════════════════════════════════════════════════════
             ██  EXPRESSIONS
        ══════════════════════════════════════════════════════════ -->

        <!-- ─────────── HAPPY ─────────── -->
        <g *ngIf="expression === 'happy'">
          <!-- Left eye — teardrop shape -->
          <path d="M 54,96 C 40,96 36,76 46,68 C 52,63 64,66 66,76 C 68,86 66,96 54,96 Z"
                fill="#40345F"/>
          <!-- Big catchlight upper-left -->
          <ellipse cx="48" cy="73" rx="7" ry="6" fill="#FFFFFF" opacity="0.95"/>
          <!-- Secondary sparkle lower-right -->
          <circle cx="61" cy="89" r="2.8" fill="#FFFFFF" opacity="0.80"/>

          <!-- Right eye — teardrop shape -->
          <path d="M 106,96 C 92,96 88,76 98,68 C 104,63 116,66 118,76 C 120,86 118,96 106,96 Z"
                fill="#40345F"/>
          <ellipse cx="100" cy="73" rx="7" ry="6" fill="#FFFFFF" opacity="0.95"/>
          <circle cx="113" cy="89" r="2.8" fill="#FFFFFF" opacity="0.80"/>

          <!-- Eyebrows — gentle upward arcs -->
          <path d="M 40,62 C 46,56 60,56 68,62"
                fill="none" stroke="#40345F" stroke-width="2.8" stroke-linecap="round"/>
          <path d="M 92,62 C 98,56 112,56 120,62"
                fill="none" stroke="#40345F" stroke-width="2.8" stroke-linecap="round"/>

          <!-- Happy squint — lower eyelid curves up -->
          <path d="M 38,89 C 46,96 62,96 68,89"
                fill="none" stroke="#40345F" stroke-width="2.4" stroke-linecap="round"/>
          <path d="M 90,89 C 98,96 114,96 120,89"
                fill="none" stroke="#40345F" stroke-width="2.4" stroke-linecap="round"/>

          <!-- Smile -->
          <path d="M 70,107 C 74,113 86,113 90,107"
                fill="none" stroke="#40345F" stroke-width="2.8" stroke-linecap="round"/>

          <!-- Chat bubble accent -->
          <g *ngIf="showAccents && numericSize >= 44" class="floating-accent">
            <rect x="118" y="28" width="30" height="24" rx="8" fill="#F3DCE8" stroke="#E4BCD1" stroke-width="1.2"/>
            <path d="M 126,52 L 120,60 L 130,54 Z" fill="#F3DCE8"/>
            <!-- Heart inside bubble -->
            <path d="M 133 38 C 131 34 126 36 126 40 C 126 44 133 47 133 47 C 133 47 140 44 140 40 C 140 36 135 34 133 38 Z"
                  fill="#E05D84"/>
          </g>
        </g>

        <!-- ─────────── SAD ─────────── -->
        <g *ngIf="expression === 'sad'">
          <!-- Left eye -->
          <path d="M 54,97 C 40,97 36,77 46,69 C 52,64 64,67 66,77 C 68,87 66,97 54,97 Z"
                fill="#40345F"/>
          <ellipse cx="48" cy="74" rx="6.5" ry="5.5" fill="#FFFFFF" opacity="0.95"/>
          <circle cx="61" cy="90" r="2.5" fill="#FFFFFF" opacity="0.80"/>

          <!-- Right eye -->
          <path d="M 106,97 C 92,97 88,77 98,69 C 104,64 116,67 118,77 C 120,87 118,97 106,97 Z"
                fill="#40345F"/>
          <ellipse cx="100" cy="74" rx="6.5" ry="5.5" fill="#FFFFFF" opacity="0.95"/>
          <circle cx="113" cy="90" r="2.5" fill="#FFFFFF" opacity="0.80"/>

          <!-- Sad brows — inner corners raised sharply -->
          <path d="M 40,65 C 46,70 60,70 68,65"
                fill="none" stroke="#40345F" stroke-width="2.8" stroke-linecap="round"/>
          <path d="M 92,65 C 98,70 112,70 120,65"
                fill="none" stroke="#40345F" stroke-width="2.8" stroke-linecap="round"/>

          <!-- Downturned mouth -->
          <path d="M 70,110 C 74,105 86,105 90,110"
                fill="none" stroke="#40345F" stroke-width="2.8" stroke-linecap="round"/>

          <!-- Tear drops -->
          <path d="M 46,93 C 44,98 42,104 46,108 C 50,104 48,98 46,93 Z"
                fill="#8ACFEE" filter="url(#tearGlow)" opacity="0.90"/>
          <path d="M 114,93 C 112,98 110,104 114,108 C 118,104 116,98 114,93 Z"
                fill="#8ACFEE" filter="url(#tearGlow)" opacity="0.90"/>
        </g>

        <!-- ─────────── EXCITED ─────────── -->
        <g *ngIf="expression === 'excited'">
          <!-- Left eye — slightly wider -->
          <path d="M 54,96 C 38,96 34,74 46,66 C 52,61 66,64 68,76 C 70,88 68,96 54,96 Z"
                fill="#40345F"/>
          <!-- Star catchlight -->
          <path d="M 50,68 L 52,74 L 58,76 L 52,78 L 50,84 L 48,78 L 42,76 L 48,74 Z"
                fill="#FFFFFF"/>
          <circle cx="62" cy="90" r="2.4" fill="#FFFFFF" opacity="0.80"/>

          <!-- Right eye -->
          <path d="M 106,96 C 90,96 86,74 98,66 C 104,61 118,64 120,76 C 122,88 120,96 106,96 Z"
                fill="#40345F"/>
          <path d="M 102,68 L 104,74 L 110,76 L 104,78 L 102,84 L 100,78 L 94,76 L 100,74 Z"
                fill="#FFFFFF"/>
          <circle cx="114" cy="90" r="2.4" fill="#FFFFFF" opacity="0.80"/>

          <!-- Raised excited brows -->
          <path d="M 38,58 C 46,52 62,52 70,58"
                fill="none" stroke="#40345F" stroke-width="2.8" stroke-linecap="round"/>
          <path d="M 90,58 C 98,52 114,52 122,58"
                fill="none" stroke="#40345F" stroke-width="2.8" stroke-linecap="round"/>

          <!-- Open excited mouth -->
          <path d="M 69,108 Q 80,120 91,108 Q 86,112 80,112 Q 74,112 69,108 Z" fill="#40345F"/>
          <path d="M 71,110 Q 80,118 89,110 Q 85,114 80,114 Q 75,114 71,110 Z" fill="#E05D84"/>

          <!-- Sparkles -->
          <g *ngIf="showAccents && numericSize >= 44" class="sparkle-accent">
            <path d="M 130,52 L 132,58 L 138,60 L 132,62 L 130,68 L 128,62 L 122,60 L 128,58 Z"
                  fill="#C8A951"/>
            <path d="M 20,50 L 21.5,55 L 27,57 L 21.5,59 L 20,64 L 18.5,59 L 13,57 L 18.5,55 Z"
                  fill="#E05D84"/>
          </g>
        </g>

        <!-- ─────────── TIRED ─────────── -->
        <g *ngIf="expression === 'tired'">
          <!-- Left eye (full shape, then clipped by eyelid) -->
          <path d="M 54,96 C 40,96 36,76 46,68 C 52,63 64,66 66,76 C 68,86 66,96 54,96 Z"
                fill="#40345F"/>
          <circle cx="50" cy="85" r="3.5" fill="#FFFFFF" opacity="0.80"/>
          <!-- Heavy drooping eyelid -->
          <path d="M 36,78 C 46,70 64,70 68,78 L 68,66 L 36,66 Z" fill="#B9A7E8"/>
          <path d="M 36,78 C 46,70 64,70 68,78"
                fill="none" stroke="#40345F" stroke-width="2.8" stroke-linecap="round"/>

          <!-- Right eye -->
          <path d="M 106,96 C 92,96 88,76 98,68 C 104,63 116,66 118,76 C 120,86 118,96 106,96 Z"
                fill="#40345F"/>
          <circle cx="102" cy="85" r="3.5" fill="#FFFFFF" opacity="0.80"/>
          <!-- Heavy drooping eyelid -->
          <path d="M 88,78 C 98,70 116,70 120,78 L 120,66 L 88,66 Z" fill="#B9A7E8"/>
          <path d="M 88,78 C 98,70 116,70 120,78"
                fill="none" stroke="#40345F" stroke-width="2.8" stroke-linecap="round"/>

          <!-- Flat brows — slightly inward -->
          <path d="M 38,62 C 46,60 62,60 68,63"
                fill="none" stroke="#40345F" stroke-width="2.5" stroke-linecap="round"/>
          <path d="M 92,63 C 98,60 114,60 122,62"
                fill="none" stroke="#40345F" stroke-width="2.5" stroke-linecap="round"/>

          <!-- Slack open mouth -->
          <path d="M 72,110 C 76,114 84,114 88,110"
                fill="none" stroke="#40345F" stroke-width="2.4" stroke-linecap="round"/>

          <!-- Z Z Z -->
          <g *ngIf="showAccents && numericSize >= 44" class="zzz-accent"
             fill="#8E78C7" font-family="'Arial Rounded MT Bold', Arial, sans-serif" font-weight="800">
            <text x="124" y="52" font-size="16">z</text>
            <text x="133" y="38" font-size="12">z</text>
            <text x="140" y="27" font-size="9">z</text>
          </g>
        </g>

        <!-- ─────────── CURIOUS ─────────── -->
        <g *ngIf="expression === 'curious'">
          <!-- Left eye — iris shifted up-right (looking sideways-up) -->
          <path d="M 54,96 C 40,96 36,76 46,68 C 52,63 64,66 66,76 C 68,86 66,96 54,96 Z"
                fill="#40345F"/>
          <!-- Catchlight shifted right (gaze direction) -->
          <ellipse cx="58" cy="70" rx="6" ry="5.5" fill="#FFFFFF" opacity="0.95"/>
          <circle cx="41" cy="88" r="2.2" fill="#FFFFFF" opacity="0.75"/>

          <!-- Right eye — looking the same direction -->
          <path d="M 106,96 C 92,96 88,76 98,68 C 104,63 116,66 118,76 C 120,86 118,96 106,96 Z"
                fill="#40345F"/>
          <ellipse cx="110" cy="70" rx="6" ry="5.5" fill="#FFFFFF" opacity="0.95"/>
          <circle cx="93" cy="88" r="2.2" fill="#FFFFFF" opacity="0.75"/>

          <!-- One brow arched higher (right), one flat (left) -->
          <path d="M 40,65 C 46,61 60,62 68,66"
                fill="none" stroke="#40345F" stroke-width="2.5" stroke-linecap="round"/>
          <path d="M 92,58 C 98,52 112,52 120,58"
                fill="none" stroke="#40345F" stroke-width="2.8" stroke-linecap="round"/>

          <!-- Small 'o' mouth -->
          <ellipse cx="80" cy="111" rx="4" ry="4.5" fill="#40345F"/>

          <!-- Question mark -->
          <g *ngIf="showAccents && numericSize >= 44" class="floating-accent"
             fill="#8E78C7" font-family="'Arial Rounded MT Bold', Arial, sans-serif" font-weight="900">
            <text x="126" y="48" font-size="26">?</text>
          </g>
        </g>

        <!-- ─────────── SURPRISED ─────────── -->
        <g *ngIf="expression === 'surprised'">
          <!-- Left eye — maximum size, perfectly round catchlight -->
          <path d="M 54,97 C 38,97 32,75 44,66 C 50,61 68,64 70,76 C 72,88 70,97 54,97 Z"
                fill="#40345F"/>
          <ellipse cx="47" cy="71" rx="8.5" ry="7.5" fill="#FFFFFF" opacity="0.95"/>
          <circle cx="64" cy="90" r="3"   fill="#FFFFFF" opacity="0.80"/>

          <!-- Right eye -->
          <path d="M 106,97 C 90,97 86,75 98,66 C 104,61 122,64 124,76 C 126,88 124,97 108,97 Z"
                fill="#40345F" transform="translate(-2,0)"/>
          <ellipse cx="101" cy="71" rx="8.5" ry="7.5" fill="#FFFFFF" opacity="0.95"/>
          <circle cx="118" cy="90" r="3"   fill="#FFFFFF" opacity="0.80"/>

          <!-- Very high arched brows -->
          <path d="M 36,56 C 46,48 64,48 72,56"
                fill="none" stroke="#40345F" stroke-width="3" stroke-linecap="round"/>
          <path d="M 88,56 C 96,48 114,48 124,56"
                fill="none" stroke="#40345F" stroke-width="3" stroke-linecap="round"/>

          <!-- Round open 'O' mouth -->
          <ellipse cx="80" cy="112" rx="6" ry="6.5" fill="#40345F"/>

          <!-- Radiating surprise lines -->
          <g *ngIf="showAccents && numericSize >= 44" stroke="#C8A951" stroke-width="2.5" stroke-linecap="round">
            <line x1="22" y1="52" x2="12" y2="44"/>
            <line x1="18" y1="62" x2="6"  y2="58"/>
            <line x1="136" y1="52" x2="148" y2="44"/>
            <line x1="140" y1="62" x2="152" y2="58"/>
          </g>
        </g>

        <!-- ─────────── PEEKING ─────────── -->
        <g *ngIf="expression === 'peeking'">
          <!-- Left eye — eager upward gaze -->
          <path d="M 54,88 C 40,88 36,68 46,60 C 52,55 64,58 66,68 C 68,78 66,88 54,88 Z"
                fill="#40345F"/>
          <ellipse cx="48" cy="63" rx="7" ry="5.5" fill="#FFFFFF" opacity="0.95"/>
          <circle cx="61" cy="82" r="2.5" fill="#FFFFFF" opacity="0.80"/>

          <!-- Right eye -->
          <path d="M 106,88 C 92,88 88,68 98,60 C 104,55 116,58 118,68 C 120,78 118,88 106,88 Z"
                fill="#40345F"/>
          <ellipse cx="100" cy="63" rx="7" ry="5.5" fill="#FFFFFF" opacity="0.95"/>
          <circle cx="113" cy="82" r="2.5" fill="#FFFFFF" opacity="0.80"/>

          <!-- Happy eager brows -->
          <path d="M 40,54 C 46,48 60,48 68,54"
                fill="none" stroke="#40345F" stroke-width="2.6" stroke-linecap="round"/>
          <path d="M 92,54 C 98,48 112,48 120,54"
                fill="none" stroke="#40345F" stroke-width="2.6" stroke-linecap="round"/>

          <!-- Big smile -->
          <path d="M 68,96 C 72,102 88,102 92,96"
                fill="none" stroke="#40345F" stroke-width="2.8" stroke-linecap="round"/>

          <!-- Two little paw stumps at card edge -->
          <ellipse cx="46" cy="118" rx="13" ry="9"  fill="#B9A7E8" stroke="#8E78C7" stroke-width="2.2"/>
          <ellipse cx="114" cy="118" rx="13" ry="9" fill="#B9A7E8" stroke="#8E78C7" stroke-width="2.2"/>
          <!-- Finger divots on paws -->
          <path d="M 40,112 Q 46,109 52,112" fill="none" stroke="#8E78C7" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M 108,112 Q 114,109 120,112" fill="none" stroke="#8E78C7" stroke-width="1.5" stroke-linecap="round"/>
        </g>

      </svg>
    </div>
  `,
  styles: [`
    :host {
      display: inline-block;
      vertical-align: middle;
      line-height: 0;
    }

    .mascot-wrapper {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      user-select: none;

      &.animated {
        animation: mascotBob 3.6s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite alternate;
      }

      &.interactive {
        cursor: pointer;
        transition: transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
        &:hover {
          transform: translateY(-6px) scale(1.07) rotate(-1.5deg);
        }
        &:active {
          transform: translateY(-2px) scale(0.97);
        }
      }
    }

    .mascot-svg {
      overflow: visible;
    }

    /* ── Curly strand sway ── */
    .curly-strand {
      transform-origin: 76px 44px;
    }
    .curly-strand.droopy {
      transform: rotate(4deg);
    }

    /* ── Accent animations ── */
    .floating-accent {
      animation: accentFloat 2.6s ease-in-out infinite alternate;
    }
    .sparkle-accent {
      animation: sparklePulse 1.8s ease-in-out infinite alternate;
    }
    .zzz-accent {
      animation: zzzDrift 3.2s ease-in-out infinite;
    }

    /* ── Keyframes ── */
    @keyframes mascotBob {
      0%   { transform: translateY(0px)   scale(1);    }
      40%  { transform: translateY(-4px)  scale(1.01); }
      100% { transform: translateY(-7px)  scale(1.02); }
    }

    @keyframes accentFloat {
      0%   { transform: translateY(0)    rotate(-4deg); }
      100% { transform: translateY(-6px) rotate(4deg);  }
    }

    @keyframes sparklePulse {
      0%   { opacity: 0.55; transform: scale(0.85); }
      100% { opacity: 1;    transform: scale(1.2);  }
    }

    @keyframes zzzDrift {
      0%   { opacity: 0.25; transform: translate(0,  0px); }
      50%  { opacity: 0.90; }
      100% { opacity: 0.15; transform: translate(5px, -8px); }
    }

    @keyframes strandSway {
      0%   { transform: rotate(-2deg); }
      100% { transform: rotate( 3deg); }
    }
  `]
})
export class MascotComponent {
  @Input() expression: MascotExpression = 'happy';
  @Input() size: number | string = 48;
  @Input() animated: boolean = false;
  @Input() showAccents: boolean = true;
  @Input() interactive: boolean = false;

  get numericSize(): number {
    return typeof this.size === 'number' ? this.size : (parseInt(this.size, 10) || 48);
  }
}
