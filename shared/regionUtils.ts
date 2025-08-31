// Utility function to map provinces to their respective regions
export function getRegionFromProvince(province: string): string | null {
  if (!province) return null;
  
  const provinceLower = province.toLowerCase();
  
  const regionMapping: { [key: string]: string[] } = {
    "ncr": ["manila", "quezon city", "makati", "taguig", "pasig", "mandaluyong", "san juan", "marikina", "pasay", "paranaque", "las pinas", "muntinlupa", "caloocan", "malabon", "navotas", "valenzuela", "pateros"],
    "central luzon": ["bulacan", "nueva ecija", "pampanga", "tarlac", "zambales", "aurora", "bataan", "malolos", "san fernando", "cabanatuan", "tarlac city", "olongapo", "balanga"],
    "calabarzon": ["cavite", "laguna", "batangas", "rizal", "quezon", "antipolo", "dasmarinas", "bacoor", "calamba", "santa rosa", "binan", "san pedro", "cabuyao", "lucena", "batangas city"],
    "ilocos": ["ilocos norte", "ilocos sur", "la union", "pangasinan", "laoag", "vigan", "san fernando", "dagupan", "alaminos", "urdaneta"],
    "cagayan valley": ["cagayan", "isabela", "nueva vizcaya", "quirino", "tuguegarao", "ilagan", "cauayan", "santiago", "bayombong"],
    "bicol": ["albay", "camarines norte", "camarines sur", "catanduanes", "masbate", "sorsogon", "legazpi", "naga", "iriga", "tabaco", "ligao"],
    "western visayas": ["aklan", "antique", "capiz", "guimaras", "iloilo", "negros occidental", "iloilo city", "bacolod", "kalibo", "roxas", "san jose"],
    "central visayas": ["bohol", "cebu", "negros oriental", "siquijor", "cebu city", "mandaue", "lapu-lapu", "talisay", "dumaguete", "bago", "tagbilaran"],
    "eastern visayas": ["biliran", "eastern samar", "leyte", "northern samar", "samar", "southern leyte", "tacloban", "ormoc", "maasin", "baybay", "calbayog"],
    "zamboanga peninsula": ["zamboanga del norte", "zamboanga del sur", "zamboanga sibugay", "zamboanga city", "pagadian", "dipolog"],
    "northern mindanao": ["bukidnon", "camiguin", "lanao del norte", "misamis occidental", "misamis oriental", "cagayan de oro", "iligan", "malaybalay", "oroquieta", "tangub"],
    "davao": ["davao del norte", "davao del sur", "davao occidental", "davao oriental", "davao de oro", "davao city", "tagum", "panabo", "samal", "digos"],
    "soccsksargen": ["cotabato", "sarangani", "south cotabato", "sultan kudarat", "general santos", "koronadal", "kidapawan", "tacurong"],
    "caraga": ["agusan del norte", "agusan del sur", "dinagat islands", "surigao del norte", "surigao del sur", "butuan", "cabadbaran", "bayugan", "surigao", "tandag"],
    "car": ["abra", "apayao", "benguet", "ifugao", "kalinga", "mountain province", "baguio", "tabuk", "bangued", "la trinidad"],
    "armm": ["basilan", "lanao del sur", "maguindanao", "sulu", "tawi-tawi", "marawi", "lamitan", "jolo"],
    "mimaropa": ["marinduque", "occidental mindoro", "oriental mindoro", "palawan", "romblon", "puerto princesa", "calapan", "mamburao", "boac", "romblon"]
  };

  for (const [region, provinces] of Object.entries(regionMapping)) {
    if (provinces.includes(provinceLower)) {
      return region;
    }
  }
  
  return null;
}

// Get all regions for dropdown options
export function getAllRegions(): { value: string; label: string }[] {
  return [
    { value: "ncr", label: "NCR (National Capital Region)" },
    { value: "central luzon", label: "Central Luzon (Region III)" },
    { value: "calabarzon", label: "CALABARZON (Region IV-A)" },
    { value: "ilocos", label: "Ilocos (Region I)" },
    { value: "cagayan valley", label: "Cagayan Valley (Region II)" },
    { value: "bicol", label: "Bicol (Region V)" },
    { value: "western visayas", label: "Western Visayas (Region VI)" },
    { value: "central visayas", label: "Central Visayas (Region VII)" },
    { value: "eastern visayas", label: "Eastern Visayas (Region VIII)" },
    { value: "zamboanga peninsula", label: "Zamboanga Peninsula (Region IX)" },
    { value: "northern mindanao", label: "Northern Mindanao (Region X)" },
    { value: "davao", label: "Davao (Region XI)" },
    { value: "soccsksargen", label: "SOCCSKSARGEN (Region XII)" },
    { value: "caraga", label: "Caraga (Region XIII)" },
    { value: "car", label: "CAR (Cordillera Administrative Region)" },
    { value: "armm", label: "ARMM (Autonomous Region in Muslim Mindanao)" },
    { value: "mimaropa", label: "MIMAROPA (Region IV-B)" }
  ];
}