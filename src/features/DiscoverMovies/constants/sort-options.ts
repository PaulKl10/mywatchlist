export const SORT_OPTIONS = [
  { value: "popularity.desc", label: "Popularité (desc)" },
  { value: "popularity.asc", label: "Popularité (asc)" },
  { value: "vote_average.desc", label: "Note (desc)" },
  { value: "vote_average.asc", label: "Note (asc)" },
  { value: "primary_release_date.desc", label: "Date de sortie (récent)" },
  { value: "primary_release_date.asc", label: "Date de sortie (ancien)" },
  { value: "title.asc", label: "Titre (A-Z)" },
  { value: "title.desc", label: "Titre (Z-A)" },
] as const;
