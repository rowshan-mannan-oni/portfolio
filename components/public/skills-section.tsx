import type { SkillCategoryWithSkills } from "@/lib/data/public";
import { Section } from "@/components/public/section";
import { cn } from "@/lib/utils";

type Props = {
  index: number;
  heading: string;
  subheading: string | null;
  categories: SkillCategoryWithSkills[];
};

export function SkillsSection({ index, heading, subheading, categories }: Props) {
  return (
    <Section id="skills" index={index} heading={heading} subheading={subheading} tone="alt">
      <div className="grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <div key={category.id} className="border-t border-border-strong pt-5" data-reveal>
            <h3 className="text-[1.02rem] font-semibold tracking-tight">{category.name}</h3>
            {category.description ? (
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{category.description}</p>
            ) : null}
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {category.skills.map((skill) => (
                <li
                  key={skill.id}
                  className={cn(
                    "chip text-[0.8rem]",
                    skill.featured && "border-primary/30 bg-soft text-soft-fg",
                  )}
                >
                  {skill.name}
                  {skill.proficiency ? (
                    <span className="text-subtle">· {skill.proficiency}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}
