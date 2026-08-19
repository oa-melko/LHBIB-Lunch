-- Membres de l équipe repris de la base SQLite locale (prisma/dev.db).
-- À exécuter une seule fois dans le SQL Editor de Neon.

INSERT INTO "TeamMember" (id, name, color, active) VALUES
  (1, 'Mourad', '#E2725B', true),
  (2, 'Mohamed', '#F4A261', true),
  (3, 'Ismail', '#2A9D8F', true),
  (4, 'Hassan', '#E76F51', true),
  (5, 'Yassine M', '#8AB17D', true),
  (6, 'Yassine A', '#EE8959', true),
  (7, 'Oussama', '#287271', true),
  (8, 'Lahoucine', '#B5838D', true),
  (9, 'Belaid', '#E2725B', true),
  (10, 'Rayane', '#F4A261', true)
ON CONFLICT (id) DO NOTHING;

-- Les id sont conservés ; on replace donc la séquence après le dernier,
-- sinon le prochain membre ajouté depuis l app réutiliserait l id 1.
SELECT setval('"TeamMember_id_seq"', (SELECT MAX(id) FROM "TeamMember"));
