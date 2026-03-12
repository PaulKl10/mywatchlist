export const SORT_OPTIONS_TV = [
  { value: "popularity.desc", label: "Popularité (desc)" },
  { value: "popularity.asc", label: "Popularité (asc)" },
  { value: "vote_average.desc", label: "Note (desc)" },
  { value: "vote_average.asc", label: "Note (asc)" },
  { value: "first_air_date.desc", label: "Date de diffusion (récent)" },
  { value: "first_air_date.asc", label: "Date de diffusion (ancien)" },
  { value: "name.asc", label: "Titre (A-Z)" },
  { value: "name.desc", label: "Titre (Z-A)" },
] as const;
