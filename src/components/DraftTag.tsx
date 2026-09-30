import { site } from '../content/site';

/** Marks placeholder / unverified facts in the UI while site.showDraftTags is true. */
export function DraftTag() {
  if (!site.showDraftTags) return null;
  return <span className="draft-tag">{site.draftTagText}</span>;
}
