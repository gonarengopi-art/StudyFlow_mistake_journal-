/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Subject, Topic, Subtopic, MistakeEntry } from './types';

export const INITIAL_SUBJECTS: Subject[] = [
  { id: 'sb-bio', name: 'Biology' },
  { id: 'sb-chem', name: 'Chemistry' },
  { id: 'sb-ucat', name: 'UCAT' },
  { id: 'sb-phys', name: 'Advanced Physics' }
];

export const INITIAL_TOPICS: Topic[] = [
  // Biology
  { id: 'tp-bio-gen', subjectId: 'sb-bio', name: 'Genetics' },
  { id: 'tp-bio-cell', subjectId: 'sb-bio', name: 'Cell Transport' },
  { id: 'tp-bio-photo', subjectId: 'sb-bio', name: 'Photosynthesis' },
  { id: 'tp-bio-evol', subjectId: 'sb-bio', name: 'Evolution' },
  { id: 'tp-bio-homeo', subjectId: 'sb-bio', name: 'Homeostasis' },
  
  // Chemistry
  { id: 'tp-chem-vol', subjectId: 'sb-chem', name: 'Volumetric Analysis' },
  { id: 'tp-chem-alk', subjectId: 'sb-chem', name: 'Alkanes' },

  // UCAT
  { id: 'tp-ucat-quant', subjectId: 'sb-ucat', name: 'Quantitative Reasoning' },
  { id: 'tp-ucat-verb', subjectId: 'sb-ucat', name: 'Verbal Reasoning' },
  { id: 'tp-ucat-abstract', subjectId: 'sb-ucat', name: 'Abstract Reasoning' },
  { id: 'tp-ucat-dec', subjectId: 'sb-ucat', name: 'Decision Making' },

  // Advanced Physics
  { id: 'tp-phys-qm', subjectId: 'sb-phys', name: 'Quantum Mechanics' }
];

export const INITIAL_SUBTOPICS: Subtopic[] = [
  // Genetics
  { id: 'sbt-bio-gen-mono', topicId: 'tp-bio-gen', name: 'Monohybrid Inheritance' },
  { id: 'sbt-bio-gen-di', topicId: 'tp-bio-gen', name: 'Dihybrid Inheritance' },
  { id: 'sbt-bio-gen-ped', topicId: 'tp-bio-gen', name: 'Pedigree Analysis' },

  // Cell Transport
  { id: 'sbt-bio-cell-diff', topicId: 'tp-bio-cell', name: 'Diffusion' },
  { id: 'sbt-bio-cell-osm', topicId: 'tp-bio-cell', name: 'Osmosis' },

  // Quantitative Reasoning
  { id: 'sbt-ucat-qr-pct', topicId: 'tp-ucat-quant', name: 'Percentages' },
  { id: 'sbt-ucat-qr-rt', topicId: 'tp-ucat-quant', name: 'Ratios' },
  { id: 'sbt-ucat-qr-data', topicId: 'tp-ucat-quant', name: 'Data Interpretation' },

  // Volumetric Analysis
  { id: 'sbt-chem-vol-acid', topicId: 'tp-chem-vol', name: 'Acid-Base Titrations' }
];

const getRelDate = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

export const INITIAL_MISTAKES: MistakeEntry[] = [
  {
    id: 'm-42',
    title: 'Quantum Tunneling Paradox',
    subjectId: 'sb-phys',
    topicId: 'tp-phys-qm',
    subtopicId: undefined, // No subtopic selected
    dateLogged: getRelDate(0),
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCg9xCGGuZaLesmuRRH25xy9f80_rRgcSMmRJRg-TX5CdodZrZ0hpK57JumtguJJRCa_vprhJNBADBsz2d2fxnd5Zk1WTkC0IEuLScAcD3_gtJwtCWtD_aYtCfoITkhNFi90IGphvk-pnXGe_qsEck5Cq62kI-ccfNtVBrnP70Y_fHhdrcbrDvzMD8wO30HgcLU1Xuve7MPXahGcaQKZYaQdtLSVagBf7QbX9luROLHVoXe58wAZLrAxwp1jocYVoukxrJ26BxMZ8w',
    originalQuestion: 'Calculate the probability density of a particle with energy E < V₀ encountering a rectangular potential barrier of width L...',
    myAnswer: 'Complete reflection due to E < V₀ since the boundary conditions must result in zero wave function constants inside the classically forbidden zone.',
    correctAnswer: 'The wave function inside the barrier decays exponentially: \\psi(x) = C e^{-\\kappa x} + D e^{\\kappa x}, resulting in a non-zero probability of transmission (tunneling).',
    whatIGotWrong: 'I assumed that since the particle\'s energy is less than the barrier height, it must completely bounce back. I neglected the exponential decay form inside the barrier.',
    correctExplanation: 'Quantum tunneling occurs because the wave function \\psi(x) of a particle has a finite non-zero value within the classically forbidden region. By incorrectly applying the boundary conditions, you assumed a complete reflection, which only happens in an infinite potential well.',
    reflection: 'I felt rushed during the exam and skipped the verification step for my wave function constants. I confused the rectangular barrier with the step potential.',
    futureAdvice: 'Always draw the wave function before solving the integrals. If the barrier is finite, the wave exists on the other side. Don\'t let the math distract from the physics.',
    categories: ['Content Gap', 'Timing Issue'],
    status: 'Reviewing'
  },
  {
    id: 'm-bio-1',
    title: 'Monohybrid F2 Generation Ratio mismatch',
    subjectId: 'sb-bio',
    topicId: 'tp-bio-gen',
    subtopicId: 'sbt-bio-gen-mono',
    dateLogged: getRelDate(1),
    originalQuestion: 'Predict the phenotypic ratio of offspring from a heterozygous self-pollinating pea plant for flower color (Pp x Pp).',
    myAnswer: '1:2:1 (genotypic ratio instead of phenotypic).',
    correctAnswer: '3:1 phenotypic ratio (3 Purple: 1 White).',
    whatIGotWrong: 'I wrote down the genotypic ratio Pp (heterozygous) and PP/pp (homozygous) instead of thinking about active phenotypes (dominant purple trait masks white).',
    correctExplanation: 'Selfing heterozygous Pp plants creates genotypes PP, Pp, pP, pp. Since P is dominant, PP and Pp offspring yield purple flowers (3/4), while pp yields white flowers (1/4). This establishes a 3:1 phenotypic ratio.',
    reflection: 'Misparsed the word "phenotypic" as "genotypic" in a rush. I need to underline key words on biology exam sheets.',
    futureAdvice: 'Always double-check if the question asks for genotypic ratio (1:2:1) or phenotypic ratio (3:1). Highlight the prompt!',
    categories: ['Careless Error', 'Misread Question'],
    status: 'New'
  },
  {
    id: 'm-chem-1',
    title: 'Volumetric Analysis double volume calculation',
    subjectId: 'sb-chem',
    topicId: 'tp-chem-vol',
    subtopicId: 'sbt-chem-vol-acid',
    dateLogged: getRelDate(2),
    originalQuestion: 'Calculate the concentration of NaOH if 25.0 cm³ of NaOH is completely neutralized by 22.4 cm³ of 0.100 mol/dm³ HCl.',
    myAnswer: '0.179 mol/dm³ due to multiplying instead of dividing, doubling target ratio stoichiometric factor.',
    correctAnswer: '0.0896 mol/dm³.',
    whatIGotWrong: 'I double-balanced the NaOH in my equation thinking it was a diprotic acid titration, causing a mole ratio error which doubled the calculation results.',
    correctExplanation: 'Hydrochloric acid (HCl) is monoprotic and reacts with sodium hydroxide (NaOH) in a 1:1 mole ratio. Therefore, moles of HCl = moles of NaOH. Moles of HCl = 0.0224 * 0.100 = 0.00224. Hence, concentration of NaOH = 0.00224 / 0.025 = 0.0896 mol/dm³.',
    reflection: 'Balance equations explicitly on paper before performing any stoichiometry math.',
    futureAdvice: 'Make sure you verify whether the acid is monoprotic (HCl, HNO₃) or diprotic (H₂SO₄) to determine the stoichiometric multiplier correctly.',
    categories: ['Calculation Error', 'Content Gap'],
    status: 'New'
  },
  {
    id: 'm-ucat-1',
    title: 'Percentages Multiplier Compound Interest',
    subjectId: 'sb-ucat',
    topicId: 'tp-ucat-quant',
    subtopicId: 'sbt-ucat-qr-pct',
    dateLogged: getRelDate(3),
    originalQuestion: 'A population of bacteria increases by 12% every hour. If the initial population is 5,000, calculate the population after 3 hours.',
    myAnswer: '6,800 using simple interest extrapolation instead of compound (5000 * 1.36).',
    correctAnswer: '7,025 (5000 * (1.12)³).',
    whatIGotWrong: 'I applied simple addition (12% * 3 = 36% compound progress) instead of successive multiplication bounds.',
    correctExplanation: 'Every hour, the population multiplies by 1.12. Over 3 hours, the population becomes 5,000 * 1.12 * 1.12 * 1.12 = 5,000 * 1.404928 = 7,024.64 (approx 7,025).',
    reflection: 'Percentage growth over multiple periods is ALWAYS compound unless explicitly specified otherwise.',
    futureAdvice: 'Always use standard compound factor formula P * (1 + r)^t for periodic rates. UCAT timing is quick, so use the onscreen calculator memory.',
    categories: ['Misread Question', 'Timing Issue'],
    status: 'Mastered'
  }
];
