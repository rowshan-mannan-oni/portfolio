import { Hero } from "@/components/public/hero";
import { AboutSection } from "@/components/public/about-section";
import { ExperienceSection } from "@/components/public/experience-section";
import { ResearchSection } from "@/components/public/research-section";
import { PublicationsSection } from "@/components/public/publications-section";
import { ProjectsSection } from "@/components/public/projects-section";
import { SkillsSection } from "@/components/public/skills-section";
import { EducationSection } from "@/components/public/education-section";
import { AwardsSection } from "@/components/public/awards-section";
import { BlogPreviewSection } from "@/components/public/blog-preview-section";
import { ContactSection } from "@/components/public/contact-section";
import { resolveSocialLink, type ResolvedLink } from "@/components/public/social-icon";
import { JsonLd } from "@/components/public/json-ld";
import {
  getHomeContent,
  getSections,
  getSiteSettings,
  getSocialLinks,
  sectionHasContent,
} from "@/lib/data/public";
import { cvDownloadUrl } from "@/lib/site";
import { storageUrl } from "@/lib/storage";
import { SITE_URL } from "@/lib/env";
import { doiUrl, safeUrl } from "@/lib/utils";
import type { SectionKey } from "@/types/database";

// Static, regenerated hourly and immediately after any admin edit.
export const revalidate = 3600;

export default async function HomePage() {
  const [settings, sections, socialLinks, content] = await Promise.all([
    getSiteSettings(),
    getSections(),
    getSocialLinks(),
    getHomeContent(),
  ]);

  const links = socialLinks.map(resolveSocialLink).filter((l): l is ResolvedLink => l !== null);
  const shown = sections.filter((s) => s.visible && sectionHasContent(s.key, settings, content));
  const isShown = (key: SectionKey) => shown.some((s) => s.key === key);
  const cvUrl = cvDownloadUrl(settings);

  const renderSection = (key: SectionKey, index: number, heading: string, subheading: string | null) => {
    const common = { index, heading, subheading };
    switch (key) {
      case "about":
        return <AboutSection key={key} {...common} settings={settings} />;
      case "experience":
        return <ExperienceSection key={key} {...common} items={content.experiences} />;
      case "research":
        return (
          <ResearchSection
            key={key}
            {...common}
            intro={settings.research_intro}
            interests={settings.research_interests}
            items={content.research}
            showPublicationLinks={isShown("publications")}
          />
        );
      case "publications":
        return (
          <PublicationsSection
            key={key}
            {...common}
            items={content.publications}
            authorNames={[settings.full_name, ...settings.author_names]}
          />
        );
      case "projects":
        return <ProjectsSection key={key} {...common} items={content.projects} />;
      case "skills":
        return <SkillsSection key={key} {...common} categories={content.skillCategories} />;
      case "education":
        return <EducationSection key={key} {...common} items={content.education} />;
      case "awards":
        return <AwardsSection key={key} {...common} items={content.awards} />;
      case "blog":
        return <BlogPreviewSection key={key} {...common} posts={content.posts} />;
      case "contact":
        return (
          <ContactSection
            key={key}
            {...common}
            availability={settings.availability}
            links={links}
          />
        );
    }
  };

  const sameAs = links.filter((l) => l.external && l.href).map((l) => l.href!);
  const photo = storageUrl(settings.profile_image_path);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Person",
          name: settings.full_name,
          jobTitle: settings.professional_title ?? undefined,
          description: settings.hero_description ?? undefined,
          url: SITE_URL,
          image: photo ?? undefined,
          email: settings.email ? `mailto:${settings.email}` : undefined,
          knowsAbout: settings.research_interests.length > 0 ? settings.research_interests : undefined,
          alumniOf: content.education
            .filter((e) => e.degree && !/exchange/i.test(e.degree))
            .map((e) => ({ "@type": "CollegeOrUniversity", name: e.institution })),
          sameAs: sameAs.length > 0 ? sameAs : undefined,
        }}
      />
      {content.publications.length > 0 ? (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@graph": content.publications.map((p) => ({
              "@type": "ScholarlyArticle",
              headline: p.title,
              author: p.authors.map((name) => ({ "@type": "Person", name })),
              datePublished: p.year ? String(p.year) : undefined,
              isPartOf: p.venue ? { "@type": "Periodical", name: p.venue } : undefined,
              publisher: p.publisher ? { "@type": "Organization", name: p.publisher } : undefined,
              sameAs: doiUrl(p.doi) ?? safeUrl(p.publisher_url) ?? undefined,
            })),
          }}
        />
      ) : null}
      <Hero
        settings={settings}
        cvUrl={cvUrl}
        links={links}
        anchors={{
          work: isShown("projects") ? "/#projects" : isShown("experience") ? "/#experience" : null,
          research: isShown("research") ? "/#research" : isShown("publications") ? "/#publications" : null,
          contact: isShown("contact") ? "/#contact" : null,
        }}
      />
      {shown.map((section, i) => renderSection(section.key, i + 1, section.heading, section.subheading))}
    </>
  );
}
