import { useEffect, useState } from "react";
import { useTokens } from "@/theme";
import { Text } from "@/components/ui";

/* ---------------------------------- Types --------------------------------- */

interface RepoCardData {
  slug: string;
  description: string;
  language: string;
  stars: number;
  isFallback?: boolean;
}

interface OrgStats {
  repoCount: number;
  stars: number;
  forks: number;
  openIssues: number;
}

interface CommitLogEntry {
  hash: string;
  repo: string;
  kind: "feat" | "fix" | "perf" | "chore" | "docs";
  scope?: string;
  message: string;
  date: string;
}

/* ------------------------------- Config ------------------------------- */

const ORG = "SkillHiive";
const ORG_URL = `https://github.com/${ORG}`;
const ORG_REPOS_URL = `https://github.com/orgs/${ORG}/repositories`;

// Displayed until the GitHub API fetch resolves, and used as a fallback if it
// fails. Once repositories are public, these values should closely mirror the
// actual repository descriptions.

const FALLBACK_REPOS: RepoCardData[] = [
  {
    slug: "web",
    description:
      "The web client for SkillHiive. Built with complete feature parity alongside the native mobile experience.",
    language: "TypeScript",
    stars: 0,
    isFallback: true,
  },
  {
    slug: "mobile",
    description:
      "The native React Native application for Android and iOS, delivering the full SkillHiive experience on mobile.",
    language: "TypeScript",
    stars: 0,
    isFallback: true,
  },
  {
    slug: "backend",
    description:
      "Backend services powering authentication, real-time collaboration, LiveKit session management, and platform APIs.",
    language: "JavaScript",
    stars: 0,
    isFallback: true,
  },
];

const COMMIT_LOG: CommitLogEntry[] = [
  {
    hash: "a3f9c1e",
    repo: "org",
    kind: "chore",
    message: "opened SkillHiive to the open-source community",
    date: "today",
  },
  {
    hash: "d281bb4",
    repo: "skillhiive-web",
    kind: "docs",
    message: "added community documentation and contribution guides",
    date: "today",
  },
  {
    hash: "9c04e7a",
    repo: "skillhiive-mobile",
    kind: "feat",
    scope: "platform",
    message: "completed feature parity with the web client",
    date: "2d",
  },
  {
    hash: "5b71f02",
    repo: "skillhiive-backend",
    kind: "feat",
    scope: "realtime",
    message: "secure LiveKit token issuance and session authentication",
    date: "4d",
  },
  {
    hash: "1e88a3d",
    repo: "skillhiive-web",
    kind: "feat",
    scope: "beta",
    message: "prepared public beta release",
    date: "1w",
  },
];

const PHILOSOPHY = [
  {
    title: "Built in the open",
    description:
      "SkillHiive is developed transparently. The same code running the platform is the code you can inspect, improve, and contribute to.",
  },
  {
    title: "Community before engagement",
    description:
      "We don't optimize for clicks, streaks, or endless scrolling. We build software that encourages meaningful work, genuine collaboration, and intentional interaction.",
  },
  {
    title: "Open source by commitment",
    description:
      "Open source isn't a feature or a marketing strategy. It's our commitment to transparency, trust, and building SkillHiive alongside the community.",
  },
];

const TECH_STACK = [
  { name: "React", category: "web" },
  { name: "React Native", category: "mobile" },
  { name: "TypeScript", category: "platform" },
  { name: "Node.js", category: "backend" },
  { name: "Express", category: "backend" },
  { name: "Supabase", category: "backend" },
  { name: "LiveKit", category: "realtime" },
];

const CONTRIBUTE_STEPS = [
  {
    command: "git clone https://github.com/SkillHiive/<repo>.git",
    comment: "clone the repository",
  },
  {
    command: "npm install",
    comment: "install dependencies",
  },
  {
    command: "npm run dev",
    comment: "start the development server",
  },
  {
    command: "git checkout -b feature/my-change",
    comment: "build something",
  },
  {
    command: "git push origin feature/my-change",
    comment: "push your branch",
  },
  {
    command: "Open a Pull Request",
    comment: "we'll review it together",
  },
];

/* --------------------------------- Hook ---------------------------------- */
// Fetches the org's public, non-fork repos and derives both the card list
// and aggregate stats from the same response — one call, no N+1 fan-out.
// Falls back silently on failure or rate limit.

function useOrgRepos(fallback: RepoCardData[]) {
  const [repos, setRepos] = useState<RepoCardData[]>(fallback);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`https://api.github.com/orgs/${ORG}/repos?per_page=100&type=public`);
        if (!res.ok) throw new Error("org repos fetch failed");
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error("unexpected response");

        const live: RepoCardData[] = data
          .filter((r: any) => !r.fork)
          .sort((a: any, b: any) => b.stargazers_count - a.stargazers_count)
          .slice(0, 6)
          .map((r: any) => ({
            slug: r.name,
            description: r.description ?? "No description yet.",
            language: r.language ?? "—",
            stars: r.stargazers_count ?? 0,
          }));

        if (!cancelled && live.length > 0) {
          setRepos(live);
          setIsLive(true);
        }
      } catch {
        // static fallback already covers this render
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [fallback]);

  const stats: OrgStats = {
    repoCount: repos.length,
    stars: repos.reduce((sum, r) => sum + r.stars, 0),
    forks: 0,
    openIssues: 0,
  };

  return { repos, stats, isLive };
}

/* ------------------------------- Icons ------------------------------ */
// No brand-icon dependency — inlined so this has no extra install step.

function GithubMark({ size = 16, color }: { size?: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <path d="M12 .5C5.73.5.75 5.48.75 11.75c0 5.02 3.26 9.28 7.78 10.78.57.1.78-.25.78-.55 0-.27-.01-1.16-.02-2.1-3.16.69-3.83-1.34-3.83-1.34-.52-1.31-1.26-1.66-1.26-1.66-1.03-.7.08-.69.08-.69 1.14.08 1.74 1.17 1.74 1.17 1.01 1.73 2.65 1.23 3.3.94.1-.73.4-1.23.72-1.51-2.52-.29-5.17-1.26-5.17-5.6 0-1.24.44-2.25 1.17-3.04-.12-.29-.51-1.45.11-3.02 0 0 .96-.31 3.14 1.16a10.9 10.9 0 0 1 5.72 0c2.18-1.47 3.14-1.16 3.14-1.16.62 1.57.23 2.73.11 3.02.73.79 1.17 1.8 1.17 3.04 0 4.35-2.65 5.31-5.18 5.59.41.35.77 1.04.77 2.1 0 1.52-.01 2.74-.01 3.11 0 .3.2.66.79.55A11.26 11.26 0 0 0 23.25 11.75C23.25 5.48 18.27.5 12 .5Z" />
    </svg>
  );
}

function ArrowUpRight({ size = 14, color }: { size?: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 17 17 7M7 7h10v10" />
    </svg>
  );
}

function Star({ size = 12, color }: { size?: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <path d="M12 2.5 15 9l7 .9-5.2 4.9L18.2 21 12 17.4 5.8 21l1.4-6.2L2 9.9 9 9z" />
    </svg>
  );
}

/* ------------------------------ Main section ------------------------------ */
/**
 * Drop-in "open source" showcase section for the SkillHive marketing site.
 * Framed at the org level (SkillHiveproject) since this spans multiple
 * repos — the app, the auth server, infra — not one monorepo.
 * Uses the same colors/spacing/radii/typography tokens as the rest of the
 * app via useTokens().
 */
export function OpenSource() {
  const { colors, spacing, radii, typography } = useTokens();
  const { repos, stats, isLive } = useOrgRepos(FALLBACK_REPOS);

  const commitKindColor: Record<CommitLogEntry["kind"], string> = {
    feat: colors.tint.success,
    perf: colors.tint.success,
    fix: colors.tint.warning,
    chore: colors.text.tertiary,
    docs: colors.text.tertiary,
  };

  const monoFont = 'ui-monospace, "SF Mono", "Cascadia Code", Menlo, Consolas, monospace';

  const card: React.CSSProperties = {
    border: `1px solid ${colors.border.subtle}`,
    borderRadius: radii.lg,
    background: colors.surface.secondary,
  };

  const sectionLabel: React.CSSProperties = {
    fontSize: typography.label.size,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.text.tertiary,
    fontWeight: typography.label.weight,
    marginBottom: spacing.lg,
    fontFamily: monoFont,
  };

  return (
    <section
      style={{
        width: "100%",
        background: colors.bg.elevated,
        padding: `${spacing.giant}px ${spacing.xl}px`,
      }}
    >
      <div style={{ maxWidth: 1040, margin: "0 auto" }}>
        {/* Eyebrow */}
        <div style={{ display: "flex", alignItems: "center", gap: spacing.sm, marginBottom: spacing.base }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: colors.surface.skillhive }} />
          <Text
            variant="label"
            style={{ color: colors.surface.skillhive, textTransform: "uppercase", letterSpacing: 1.5, fontFamily: monoFont }}
          >
            open source
          </Text>
        </div>

        {/* Hero */}
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: spacing.xxxl, alignItems: "center" }}>
          <div>
            <Text
              as="h2"
              variant="headline"
              style={{
                color: colors.text.primary,
                lineHeight: `${typography.headline.lineHeight}px`,
                letterSpacing: typography.headline.letterSpacing,
                margin: 0,
              }}
            >
              We're making SkillHive public. All of it.
            </Text>
            <Text
              variant="bodyLg"
              tone="secondary"
              style={{ display: "block", maxWidth: 440, marginTop: spacing.base, color: colors.text.secondary }}
            >
              Not one repo — the app, the self-hosted auth server, and the
              infra behind it, published as they actually exist. Pick
              whichever piece you're curious about.
            </Text>

            <div style={{ display: "flex", alignItems: "center", gap: spacing.lg, marginTop: spacing.xl, flexWrap: "wrap" }}>
              <a
                href={ORG_URL}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: spacing.sm,
                  padding: `${spacing.sm + 2}px ${spacing.lg}px`,
                  borderRadius: radii.md,
                  background: colors.surface.skillhive,
                  color: colors.text.onTint,
                  fontWeight: 800,
                  fontSize: typography.bodySm.size,
                  textDecoration: "none",
                }}
              >
                <GithubMark size={16} color={colors.text.onTint} />
                View organization
              </a>
              <a
                href={ORG_REPOS_URL}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: spacing.xs,
                  color: colors.text.tertiary,
                  fontSize: typography.bodySm.size,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                See all repositories
                <ArrowUpRight size={13} color={colors.text.tertiary} />
              </a>
            </div>
          </div>

          {/* Signature: cross-repo activity log */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div style={{ ...card, width: "100%", maxWidth: 460, overflow: "hidden" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: spacing.sm,
                  padding: `${spacing.sm}px ${spacing.base}px`,
                  borderBottom: `1px solid ${colors.border.subtle}`,
                }}
              >
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: colors.tint.danger, opacity: 0.7 }} />
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: colors.tint.warning, opacity: 0.7 }} />
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: colors.tint.success, opacity: 0.7 }} />
                <Text variant="caption" tone="tertiary" style={{ marginLeft: spacing.xs, fontFamily: monoFont, color: colors.text.tertiary }}>
                  activity — across repos
                </Text>
              </div>
              <div style={{ padding: spacing.base, display: "flex", flexDirection: "column", gap: spacing.sm }}>
                {COMMIT_LOG.map((entry) => (
                  <div key={entry.hash} style={{ fontFamily: monoFont, fontSize: 12.5, lineHeight: 1.6 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: spacing.xs }}>
                      <span style={{ color: colors.text.tertiary }}>{entry.hash}</span>
                      <span
                        style={{
                          color: colors.text.tertiary,
                          border: `1px solid ${colors.border.subtle}`,
                          borderRadius: radii.xs,
                          padding: "0 4px",
                          fontSize: 10.5,
                        }}
                      >
                        {entry.repo}
                      </span>
                      <span style={{ color: commitKindColor[entry.kind] }}>
                        {entry.kind}
                        {entry.scope ? `(${entry.scope})` : ""}:
                      </span>
                      <span style={{ marginLeft: "auto", color: colors.text.tertiary }}>{entry.date}</span>
                    </div>
                    <div style={{ color: colors.text.primary, marginTop: 2 }}>{entry.message}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Repositories */}
        <div style={{ marginTop: spacing.xxxl }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: spacing.lg }}>
            <Text variant="label" style={{ ...sectionLabel, marginBottom: 0 }}>
              Repositories
            </Text>
            <div style={{ display: "flex", alignItems: "center", gap: spacing.xs }}>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: isLive ? colors.tint.success : colors.text.tertiary,
                }}
              />
              <Text variant="caption" tone="tertiary" style={{ fontFamily: monoFont, color: colors.text.tertiary }}>
                {isLive ? "live" : "baseline"}
              </Text>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: spacing.md }}>
            {repos.map((repo) => (
              <a
                key={repo.slug}
                href={`${ORG_URL}/${repo.slug}`}
                target="_blank"
                rel="noreferrer"
                style={{ ...card, display: "block", padding: spacing.lg, textDecoration: "none" }}
              >
                <Text style={{ color: colors.text.primary, fontWeight: 700, fontSize: typography.bodySm.size, fontFamily: monoFont }}>
                  {repo.slug}
                </Text>
                <Text
                  variant="bodySm"
                  style={{ display: "block", marginTop: spacing.xs, color: colors.text.secondary, lineHeight: 1.5, minHeight: 36 }}
                >
                  {repo.description}
                </Text>
                <div style={{ display: "flex", alignItems: "center", gap: spacing.md, marginTop: spacing.md }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: colors.text.tertiary }} />
                    <Text variant="caption" tone="tertiary" style={{ color: colors.text.tertiary }}>
                      {repo.language}
                    </Text>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Star size={11} color={colors.text.tertiary} />
                    <Text variant="caption" tone="tertiary" style={{ color: colors.text.tertiary }}>
                      {repo.stars}
                    </Text>
                  </div>
                </div>
              </a>
            ))}
          </div>

          <Text
            variant="caption"
            tone="tertiary"
            style={{ display: "block", marginTop: spacing.md, color: colors.text.tertiary }}
          >
            {stats.repoCount} public {stats.repoCount === 1 ? "repo" : "repos"} · {stats.stars} stars combined
          </Text>
        </div>

        {/* Philosophy */}
        <div style={{ marginTop: spacing.xxxl }}>
          <Text variant="label" style={sectionLabel}>
            Why the code is public
          </Text>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 1,
              background: colors.border.subtle,
              borderRadius: radii.lg,
              overflow: "hidden",
              border: `1px solid ${colors.border.subtle}`,
            }}
          >
            {PHILOSOPHY.map((point) => (
              <div key={point.title} style={{ background: colors.surface.secondary, padding: spacing.lg }}>
                <Text style={{ color: colors.surface.skillhive, fontWeight: 700, fontSize: typography.bodySm.size }}>
                  {point.title}
                </Text>
                <Text
                  variant="bodySm"
                  style={{ display: "block", marginTop: spacing.sm, color: colors.text.secondary, lineHeight: 1.6 }}
                >
                  {point.description}
                </Text>
              </div>
            ))}
          </div>
        </div>

        {/* Stack + Contribute */}
        <div style={{ marginTop: spacing.xxxl, display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing.xxl }}>
          <div>
            <Text variant="label" style={sectionLabel}>
              Built with
            </Text>
            <div style={{ display: "flex", flexWrap: "wrap", gap: spacing.sm }}>
              {TECH_STACK.map((item) => (
                <span
                  key={item.name}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: spacing.xs,
                    borderRadius: radii.pill,
                    border: `1px solid ${colors.border.subtle}`,
                    background: colors.surface.secondary,
                    padding: `${spacing.xs + 2}px ${spacing.md}px`,
                    fontFamily: monoFont,
                    fontSize: 11.5,
                    color: colors.text.secondary,
                  }}
                >
                  <span style={{ color: colors.text.tertiary }}>{item.category}</span>
                  <span style={{ color: colors.text.tertiary, opacity: 0.6 }}>/</span>
                  {item.name}
                </span>
              ))}
            </div>
          </div>

          <div>
            <Text variant="label" style={sectionLabel}>
              Get started
            </Text>
            <div style={card}>
              <div
                style={{
                  borderBottom: `1px solid ${colors.border.subtle}`,
                  padding: `${spacing.sm}px ${spacing.base}px`,
                  fontFamily: monoFont,
                  fontSize: 11.5,
                  color: colors.text.tertiary,
                }}
              >
                first contribution
              </div>
              <div style={{ padding: spacing.base, display: "flex", flexDirection: "column", gap: spacing.md }}>
                {CONTRIBUTE_STEPS.map((step, i) => (
                  <div key={i} style={{ fontFamily: monoFont, fontSize: 12.5 }}>
                    <div style={{ display: "flex", gap: spacing.xs }}>
                      <span style={{ color: colors.surface.skillhive }}>$</span>
                      <span style={{ color: colors.text.primary }}>{step.command}</span>
                    </div>
                    <div style={{ marginLeft: spacing.md, color: colors.text.tertiary }}># {step.comment}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default OpenSource;