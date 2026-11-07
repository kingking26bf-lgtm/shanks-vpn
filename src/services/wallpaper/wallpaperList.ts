/**
 * SHANKS VPN - Landscape Wallpapers
 * Dynamic landscape backgrounds that adapt smoothly to dark and light modes.
 */

export interface WallpaperOption {
  id: 'none' | 'aurora' | 'mountains' | 'lake' | 'forest';
  name: string;
  category: string;
  description: string;
  previewGradient: string;
  cssBackground: string;
}

export const LANDSCAPE_WALLPAPERS: WallpaperOption[] = [
  {
    id: 'none',
    name: 'Bleu Nuit Classique',
    category: 'Minimaliste',
    description: 'Interface épurée avec dégradés géométriques sombres',
    previewGradient: 'linear-gradient(135deg, #050B14 0%, #0F172A 100%)',
    cssBackground: 'linear-gradient(180deg, rgba(5, 11, 20, 0.98) 0%, rgba(10, 20, 38, 0.98) 100%)',
  },
  {
    id: 'aurora',
    name: 'Aurore Boréale Boréale',
    category: 'Paysage Nocturne',
    description: 'Lumières nordiques cyan et émeraude au-dessus de fjords glacés',
    previewGradient: 'linear-gradient(135deg, #021B2B 0%, #00F0FF 50%, #0A2E50 100%)',
    cssBackground: `
      radial-gradient(circle at 50% 10%, rgba(0, 229, 255, 0.28) 0%, transparent 60%),
      radial-gradient(circle at 80% 30%, rgba(16, 185, 129, 0.20) 0%, transparent 50%),
      radial-gradient(circle at 20% 40%, rgba(59, 130, 246, 0.25) 0%, transparent 50%),
      linear-gradient(180deg, #030D1A 0%, #06152B 40%, #020813 100%)
    `,
  },
  {
    id: 'mountains',
    name: 'Pics Alpins Étoilés',
    category: 'Montagne',
    description: 'Sommets enneigés sous un ciel étoilé bleu cobalt profond',
    previewGradient: 'linear-gradient(135deg, #091224 0%, #1E3A8A 60%, #38BDF8 100%)',
    cssBackground: `
      radial-gradient(circle at 75% 15%, rgba(56, 189, 248, 0.25) 0%, transparent 45%),
      radial-gradient(circle at 25% 65%, rgba(30, 58, 138, 0.35) 0%, transparent 60%),
      linear-gradient(180deg, #050C1B 0%, #0B1936 50%, #040914 100%)
    `,
  },
  {
    id: 'lake',
    name: 'Reflet Cyber Lac',
    category: 'Eau & Nuit',
    description: 'Lac paisible reflétant des éclats de néon cyan et bleu électrique',
    previewGradient: 'linear-gradient(135deg, #04101F 0%, #0284C7 50%, #00F0FF 100%)',
    cssBackground: `
      radial-gradient(ellipse at 50% 85%, rgba(0, 240, 255, 0.22) 0%, transparent 55%),
      radial-gradient(ellipse at 30% 20%, rgba(2, 132, 199, 0.3) 0%, transparent 50%),
      linear-gradient(180deg, #020A14 0%, #051930 55%, #02070E 100%)
    `,
  },
  {
    id: 'forest',
    name: 'Forêt Céleste',
    category: 'Nature Mystique',
    description: 'Canopée de pins bleutés baignée dans la brume lumineuse',
    previewGradient: 'linear-gradient(135deg, #03141F 0%, #0D9488 50%, #38BDF8 100%)',
    cssBackground: `
      radial-gradient(circle at 50% 25%, rgba(13, 148, 136, 0.24) 0%, transparent 55%),
      radial-gradient(circle at 80% 70%, rgba(56, 189, 248, 0.2) 0%, transparent 50%),
      linear-gradient(180deg, #020E17 0%, #061D2B 45%, #02090F 100%)
    `,
  },
];
