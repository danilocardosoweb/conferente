import type { DetectionParams } from "./api";

export interface PresetConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  params: DetectionParams;
  tags: string[];
}

export const DEFAULT_PRESETS: PresetConfig[] = [
  {
    id: "standard",
    name: "Padrão Industrial",
    description: "Configuração balanceada para ambiente industrial típico. Funciona bem na maioria dos cenários.",
    icon: "Factory",
    tags: ["universal", "balanced"],
    params: {
      min_radius: 8,
      max_radius: 80,
      canny_low: 30,
      canny_high: 100,
      hough_param1: 50,
      hough_param2: 25,
      min_dist: 20,
      use_contours: true,
      use_morphology: true,
      blur_kernel: 5,
    },
  },
  {
    id: "small_profiles",
    name: "Perfis Finos",
    description: "Otimizado para perfis de alumínio finos ou pequenos (tubos 1/2\" a 1\"). Aumenta sensibilidade para detalhes.",
    icon: "Minimize2",
    tags: ["small", "sensitive"],
    params: {
      min_radius: 5,
      max_radius: 30,
      canny_low: 20,
      canny_high: 80,
      hough_param1: 40,
      hough_param2: 30,
      min_dist: 10,
      use_contours: true,
      use_morphology: true,
      blur_kernel: 3,
    },
  },
  {
    id: "large_profiles",
    name: "Perfis Robustos",
    description: "Para perfis grandes, vigas ou cantoneiras pesadas (acima de 2\"). Reduz falsos positivos em peças grandes.",
    icon: "Maximize2",
    tags: ["large", "structural"],
    params: {
      min_radius: 40,
      max_radius: 150,
      canny_low: 40,
      canny_high: 120,
      hough_param1: 60,
      hough_param2: 20,
      min_dist: 40,
      use_contours: true,
      use_morphology: true,
      blur_kernel: 7,
    },
  },
  {
    id: "low_light",
    name: "Baixa Luminosidade",
    description: "Ambiente com pouca luz ou sombras. Realce agressivo de contraste e redução de ruído.",
    icon: "Moon",
    tags: ["night", "dark", "shadows"],
    params: {
      min_radius: 8,
      max_radius: 80,
      canny_low: 15,
      canny_high: 60,
      hough_param1: 40,
      hough_param2: 35,
      min_dist: 20,
      use_contours: true,
      use_morphology: true,
      blur_kernel: 7,
    },
  },
  {
    id: "high_light",
    name: "Alta Luminosidade",
    description: "Ambiente externo ou com luz direta forte. Reduz sensibilidade para evitar reflexos.",
    icon: "Sun",
    tags: ["daylight", "outdoor", "glare"],
    params: {
      min_radius: 8,
      max_radius: 80,
      canny_low: 50,
      canny_high: 150,
      hough_param1: 70,
      hough_param2: 20,
      min_dist: 20,
      use_contours: true,
      use_morphology: false,
      blur_kernel: 3,
    },
  },
  {
    id: "high_density",
    name: "Alta Densidade",
    description: "Pallets completamente cheios com muitos perfis próximos. Otimizado para não perder contagens em aglomerados.",
    icon: "Grid3x3",
    tags: ["full", "dense", "packed"],
    params: {
      min_radius: 6,
      max_radius: 50,
      canny_low: 25,
      canny_high: 90,
      hough_param1: 45,
      hough_param2: 18,
      min_dist: 12,
      use_contours: true,
      use_morphology: true,
      blur_kernel: 3,
    },
  },
  {
    id: "tubes_round",
    name: "Tubos Circulares",
    description: "Especializado em tubos redondos ou perfis circulares. Maximiza detecção via HoughCircles.",
    icon: "Circle",
    tags: ["circular", "pipes", "round"],
    params: {
      min_radius: 10,
      max_radius: 100,
      canny_low: 30,
      canny_high: 100,
      hough_param1: 45,
      hough_param2: 22,
      min_dist: 18,
      use_contours: false,
      use_morphology: true,
      blur_kernel: 5,
    },
  },
  {
    id: "square_rectangular",
    name: "Perfis Quadrados/Retangulares",
    description: "Para cantoneiras, vigas U ou perfis quadrados. Foca em análise de contornos angulares.",
    icon: "Square",
    tags: ["angular", "structural", "beams"],
    params: {
      min_radius: 15,
      max_radius: 120,
      canny_low: 35,
      canny_high: 110,
      hough_param1: 55,
      hough_param2: 30,
      min_dist: 25,
      use_contours: true,
      use_morphology: true,
      blur_kernel: 5,
    },
  },
  {
    id: "fast_mode",
    name: "Modo Rápido",
    description: "Prioriza velocidade sobre precisão. Ideal para pré-conferências ou quando o tempo é crítico.",
    icon: "Zap",
    tags: ["speed", "draft", "quick"],
    params: {
      min_radius: 10,
      max_radius: 70,
      canny_low: 40,
      canny_high: 120,
      hough_param1: 60,
      hough_param2: 15,
      min_dist: 25,
      use_contours: false,
      use_morphology: false,
      blur_kernel: 5,
    },
  },
  {
    id: "precision_mode",
    name: "Modo Precisão",
    description: "Máxima precisão para contagens críticas. Processamento mais lento mas mais acurado.",
    icon: "Target",
    tags: ["accurate", "critical", "audit"],
    params: {
      min_radius: 5,
      max_radius: 100,
      canny_low: 20,
      canny_high: 80,
      hough_param1: 40,
      hough_param2: 40,
      min_dist: 15,
      use_contours: true,
      use_morphology: true,
      blur_kernel: 3,
    },
  },
];

export function getPresetById(id: string): PresetConfig | undefined {
  return DEFAULT_PRESETS.find((p) => p.id === id);
}

export function getPresetsByTag(tag: string): PresetConfig[] {
  return DEFAULT_PRESETS.filter((p) => p.tags.includes(tag));
}

// Sugestão automática baseada em condições
export function suggestPreset(
  profileSize: "small" | "medium" | "large",
  lighting: "low" | "normal" | "high",
  density: "sparse" | "normal" | "dense"
): PresetConfig {
  if (lighting === "low") return getPresetById("low_light")!;
  if (lighting === "high") return getPresetById("high_light")!;
  if (density === "dense") return getPresetById("high_density")!;
  if (profileSize === "small") return getPresetById("small_profiles")!;
  if (profileSize === "large") return getPresetById("large_profiles")!;
  return getPresetById("standard")!;
}
