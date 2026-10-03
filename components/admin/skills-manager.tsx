"use client";

import { useState } from "react";
import { Plus, Pencil, X } from "lucide-react";
import type { SkillCategoryRow, SkillRow } from "@/types/database";
import { AdminForm } from "@/components/admin/admin-form";
import { CheckboxField, TextField } from "@/components/admin/fields";
import { RowActions, StatusPill } from "@/components/admin/row-actions";
import { saveEntity } from "@/lib/admin/actions/content";
import { cn } from "@/lib/utils";

type Category = SkillCategoryRow & { skills: SkillRow[] };

export function SkillsManager({ categories }: { categories: Category[] }) {
  const [adding, setAdding] = useState(false);
  return (
    <div className="space-y-4">
      {categories.map((category, i) => (
        <CategoryCard key={category.id} category={category} isFirst={i === 0} isLast={i === categories.length - 1} />
      ))}

      {adding ? (
        <div className="card p-5">
          <h2 className="mb-4 text-sm font-semibold">New category</h2>
          <AdminForm action={(fd) => saveEntity("skill_categories", null, fd)} submitLabel="Add category" onSuccess={() => setAdding(false)}>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <TextField name="name" label="Name" required />
              <TextField name="description" label="Description" />
            </div>
            <input type="hidden" name="visible" value="on" />
          </AdminForm>
        </div>
      ) : (
        <button type="button" className="btn btn-secondary" onClick={() => setAdding(true)}>
          <Plus className="size-4" aria-hidden="true" />
          Add category
        </button>
      )}
    </div>
  );
}

function CategoryCard({ category, isFirst, isLast }: { category: Category; isFirst: boolean; isLast: boolean }) {
  const [editing, setEditing] = useState(false);
  const [editingSkill, setEditingSkill] = useState<string | null>(null);

  return (
    <section className={cn("card overflow-hidden", !category.visible && "opacity-80")} aria-label={category.name}>
      <div className="flex flex-col gap-3 border-b border-border bg-surface-muted/50 p-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold">{category.name}</h2>
            {!category.visible ? <StatusPill tone="muted">Hidden</StatusPill> : null}
            <span className="meta">{category.skills.length} skills</span>
          </div>
          {category.description ? <p className="mt-0.5 text-sm text-muted">{category.description}</p> : null}
        </div>
        <div className="flex items-center gap-1">
          <button type="button" className="btn btn-ghost btn-icon size-8 min-h-8" onClick={() => setEditing((e) => !e)} aria-label={`Edit ${category.name}`}>
            {editing ? <X className="size-4" aria-hidden="true" /> : <Pencil className="size-4" aria-hidden="true" />}
          </button>
          <RowActions
            entity="skill_categories"
            id={category.id}
            title={category.name}
            visible={category.visible}
            isFirst={isFirst}
            isLast={isLast}
          />
        </div>
      </div>

      {editing ? (
        <div className="border-b border-border p-4">
          <AdminForm action={(fd) => saveEntity("skill_categories", category.id, fd)} submitLabel="Save category" onSuccess={() => setEditing(false)}>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <TextField name="name" label="Name" required defaultValue={category.name} />
              <TextField name="description" label="Description" defaultValue={category.description} />
            </div>
            <CheckboxField name="visible" label="Visible" defaultChecked={category.visible} />
          </AdminForm>
        </div>
      ) : null}

      <ul className="divide-y divide-border">
        {category.skills.map((skill, i) => (
          <li key={skill.id} className="px-4 py-2.5">
            {editingSkill === skill.id ? (
              <SkillForm categoryId={category.id} skill={skill} onDone={() => setEditingSkill(null)} />
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn("text-sm", !skill.visible && "text-subtle line-through")}>{skill.name}</span>
                {skill.proficiency ? <span className="meta">{skill.proficiency}</span> : null}
                <span className="flex-1" />
                <button type="button" className="btn btn-ghost btn-icon size-8 min-h-8" onClick={() => setEditingSkill(skill.id)} aria-label={`Edit ${skill.name}`}>
                  <Pencil className="size-4" aria-hidden="true" />
                </button>
                <RowActions
                  entity="skills"
                  id={skill.id}
                  title={skill.name}
                  visible={skill.visible}
                  featured={skill.featured}
                  isFirst={i === 0}
                  isLast={i === category.skills.length - 1}
                />
              </div>
            )}
          </li>
        ))}
        <li className="px-4 py-3">
          {editingSkill === `new-${category.id}` ? (
            <SkillForm categoryId={category.id} skill={null} onDone={() => setEditingSkill(null)} />
          ) : (
            <button type="button" className="action-link text-primary" onClick={() => setEditingSkill(`new-${category.id}`)}>
              <Plus className="size-4" aria-hidden="true" />
              Add skill
            </button>
          )}
        </li>
      </ul>
    </section>
  );
}

function SkillForm({ categoryId, skill, onDone }: { categoryId: string; skill: SkillRow | null; onDone: () => void }) {
  return (
    <AdminForm
      action={(fd) => saveEntity("skills", skill?.id ?? null, fd)}
      submitLabel={skill ? "Save skill" : "Add skill"}
      onSuccess={onDone}
      className="space-y-4 py-2"
      secondaryActions={
        <button type="button" className="btn btn-ghost btn-sm" onClick={onDone}>
          Cancel
        </button>
      }
    >
      <input type="hidden" name="category_id" value={categoryId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="name" label="Skill" required defaultValue={skill?.name} />
        <TextField
          name="proficiency"
          label="Proficiency"
          defaultValue={skill?.proficiency}
          hint="Optional words such as “Familiar” — never percentages."
        />
      </div>
      <div className="flex flex-wrap gap-6">
        <CheckboxField name="visible" label="Visible" defaultChecked={skill?.visible ?? true} />
        <CheckboxField name="featured" label="Highlight" defaultChecked={skill?.featured ?? false} />
      </div>
    </AdminForm>
  );
}
