import { SheetIdea } from './sheets';

export interface ScriptBundle {
  script: string;
  prompts: string[];
  metadata: {
    title: string;
    keywords: string[];
    description: string;
  };
}

export const generateScriptBundle = (
  idea: SheetIdea | undefined,
  overrides: {
    script?: string;
    title?: string;
    keywords?: string;
  }
): ScriptBundle => {
  const baseScript = overrides.script?.trim();
  const script = baseScript && baseScript.length > 30 ? baseScript : buildScriptFromIdea(idea);
  const prompts = derivePrompts(script, idea);
  const autoTitle = buildTitle(idea, script);
  const metadata = {
    title: overrides.title?.trim() || autoTitle,
    keywords: deriveKeywords(overrides.keywords, idea, script),
    description: buildDescription(script, idea)
  };
  return {
    script,
    prompts,
    metadata
  };
};

const buildScriptFromIdea = (idea?: SheetIdea) => {
  if (!idea) {
    return `Welcome back to the channel! Today we're exploring a fresh idea in the AI automation space.

First, we'll break down why this topic matters right now and the opportunity it unlocks. Then we'll dive into the core narrative, unpacking real examples and actionable tactics you can copy immediately.

Stick around to the end for a practical blueprint you can apply as soon as this video ends.`;
  }
  const { title, description } = idea;
  const hook = `Today we are diving into ${title.toLowerCase()}.`;
  const scene1 = `In the opening moments, set the tone with a cinematic montage that illustrates the problem: ${description}. Blend fast-paced visuals with intentional pauses so viewers can absorb the stakes.`;
  const scene2 = `Transition into the core story arc. Showcase how creators or operators can leverage this idea, walking through three clear steps. Emphasize the transformation from the current status quo into the future state unlocked by automation.`;
  const scene3 = `Layer in emotional storytelling with a relatable example. Highlight the friction, the breakthrough moment, and the measurable outcome. Keep the pacing tight and intentional.`;
  const outro = `Close with a call-to-action that empowers the audience to replicate the workflow today. Offer a concise recap and a teaser for the next episode to maintain retention.`;
  return [hook, scene1, scene2, scene3, outro].join('\n\n');
};

const derivePrompts = (script: string, idea?: SheetIdea) => {
  const lines = script.split('\n').filter((line) => line.trim().length > 0);
  const unique = new Set<string>();
  const prompts = lines.map((line) => {
    const base = line.length > 110 ? line.slice(0, 110) : line;
    const prompt = `cinematic digital art, 16:9, ultra-detailed, volumetric lighting, inspired by ${idea?.title ?? 'futuristic storytelling'}, depicting: ${base}`;
    unique.add(prompt);
    return prompt;
  });
  if (prompts.length < 4 && idea) {
    prompts.push(
      `modern ui illustration, neon gradients, showcasing key steps of ${idea.title}, kinetic typography, motion graphics`
    );
  }
  return Array.from(unique);
};

const deriveKeywords = (override: string | undefined, idea: SheetIdea | undefined, script: string) => {
  if (override?.trim()) {
    return override
      .split(',')
      .map((kw) => kw.trim())
      .filter(Boolean);
  }
  const base = new Set<string>();
  if (idea) {
    idea.tags.forEach((tag) => base.add(tag.toLowerCase()));
    base.add(slugify(idea.title));
  }
  script
    .split(/[^a-zA-Z]+/)
    .filter((word) => word.length > 4)
    .slice(0, 20)
    .forEach((word) => base.add(word.toLowerCase()));
  return Array.from(base).slice(0, 15);
};

const buildTitle = (idea: SheetIdea | undefined, script: string) => {
  if (idea) {
    return smartCase(idea.title);
  }
  const sentence = script.split(/\.|\?|!/)[0] ?? 'AI Automation Workflow';
  return smartCase(sentence.trim());
};

const buildDescription = (script: string, idea?: SheetIdea) => {
  const intro = idea
    ? `In this episode we execute the "${idea.title}" automation workflow end-to-end. ${idea.description}`
    : 'In this session we execute a complete AI automation workflow from ideation to scheduling.';
  const sections = script.split('\n\n').map((segment, index) => `Scene ${index + 1}: ${segment.trim()}`);
  const callsToAction = [
    'Subscribe for more AI automation breakdowns.',
    'Drop your next video idea in the comments.',
    'Download the workflow checklist linked below.'
  ];
  return [intro, '', ...sections, '', ...callsToAction].join('\n');
};

const smartCase = (input: string) => {
  const lower = input.toLowerCase();
  return lower.replace(/(^|\s|[-_])(\w)/g, (_match, sep, char) => `${sep}${char.toUpperCase()}`).trim();
};

const slugify = (input: string) =>
  input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
