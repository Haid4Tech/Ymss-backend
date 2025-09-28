import { Request, Response } from "express";

// Generic country data
const countries = [
  { id: 1, name: "Nigeria", code: "NG", continent: "Africa" },
  { id: 2, name: "United States", code: "US", continent: "North America" },
  { id: 3, name: "United Kingdom", code: "GB", continent: "Europe" },
  { id: 4, name: "Canada", code: "CA", continent: "North America" },
  { id: 5, name: "Australia", code: "AU", continent: "Oceania" },
  { id: 6, name: "Germany", code: "DE", continent: "Europe" },
  { id: 7, name: "France", code: "FR", continent: "Europe" },
  { id: 8, name: "Japan", code: "JP", continent: "Asia" },
  { id: 9, name: "China", code: "CN", continent: "Asia" },
  { id: 10, name: "India", code: "IN", continent: "Asia" },
  { id: 11, name: "Brazil", code: "BR", continent: "South America" },
  { id: 12, name: "South Africa", code: "ZA", continent: "Africa" },
  { id: 13, name: "Egypt", code: "EG", continent: "Africa" },
  { id: 14, name: "Kenya", code: "KE", continent: "Africa" },
  { id: 15, name: "Ghana", code: "GH", continent: "Africa" },
  { id: 16, name: "Italy", code: "IT", continent: "Europe" },
  { id: 17, name: "Spain", code: "ES", continent: "Europe" },
  { id: 18, name: "Russia", code: "RU", continent: "Europe" },
  { id: 19, name: "South Korea", code: "KR", continent: "Asia" },
  { id: 20, name: "Mexico", code: "MX", continent: "North America" },
  { id: 21, name: "Argentina", code: "AR", continent: "South America" },
  { id: 22, name: "Turkey", code: "TR", continent: "Asia" },
  { id: 23, name: "Saudi Arabia", code: "SA", continent: "Asia" },
  { id: 24, name: "United Arab Emirates", code: "AE", continent: "Asia" },
  { id: 25, name: "Israel", code: "IL", continent: "Asia" },
  { id: 26, name: "Switzerland", code: "CH", continent: "Europe" },
  { id: 27, name: "Netherlands", code: "NL", continent: "Europe" },
  { id: 28, name: "Sweden", code: "SE", continent: "Europe" },
  { id: 29, name: "Norway", code: "NO", continent: "Europe" },
  { id: 30, name: "Denmark", code: "DK", continent: "Europe" },
  { id: 31, name: "Finland", code: "FI", continent: "Europe" },
  { id: 32, name: "New Zealand", code: "NZ", continent: "Oceania" },
  { id: 33, name: "Singapore", code: "SG", continent: "Asia" },
  { id: 34, name: "Thailand", code: "TH", continent: "Asia" },
  { id: 35, name: "Malaysia", code: "MY", continent: "Asia" },
  { id: 36, name: "Indonesia", code: "ID", continent: "Asia" },
  { id: 37, name: "Philippines", code: "PH", continent: "Asia" },
  { id: 38, name: "Vietnam", code: "VN", continent: "Asia" },
  { id: 39, name: "Chile", code: "CL", continent: "South America" },
  { id: 40, name: "Colombia", code: "CO", continent: "South America" },
  { id: 41, name: "Peru", code: "PE", continent: "South America" },
  { id: 42, name: "Venezuela", code: "VE", continent: "South America" },
  { id: 43, name: "Morocco", code: "MA", continent: "Africa" },
  { id: 44, name: "Tunisia", code: "TN", continent: "Africa" },
  { id: 45, name: "Algeria", code: "DZ", continent: "Africa" },
  { id: 46, name: "Ethiopia", code: "ET", continent: "Africa" },
  { id: 47, name: "Uganda", code: "UG", continent: "Africa" },
  { id: 48, name: "Tanzania", code: "TZ", continent: "Africa" },
  { id: 49, name: "Poland", code: "PL", continent: "Europe" },
  { id: 50, name: "Czech Republic", code: "CZ", continent: "Europe" },
];

export const getAllCountries = async (req: Request, res: Response) => {
  try {
    const { continent, search } = req.query;

    let filteredCountries = countries;

    // Filter by continent if provided
    if (continent) {
      filteredCountries = filteredCountries.filter(
        (country) =>
          country.continent.toLowerCase() ===
          (continent as string).toLowerCase()
      );
    }

    // Search by name if provided
    if (search) {
      const searchTerm = (search as string).toLowerCase();
      filteredCountries = filteredCountries.filter((country) =>
        country.name.toLowerCase().includes(searchTerm)
      );
    }

    res.json(filteredCountries);
  } catch (error) {
    console.error("Error fetching countries:", error);
    res.status(500).json({ error: "Failed to fetch countries" });
  }
};

export const getCountryById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const country = countries.find((c) => c.id === id);

    if (!country) {
      return res.status(404).json({ error: "Country not found" });
    }

    res.json(country);
  } catch (error) {
    console.error("Error fetching country:", error);
    res.status(500).json({ error: "Failed to fetch country" });
  }
};

export const getCountriesByContinent = async (req: Request, res: Response) => {
  try {
    const continent = req.params.continent;
    const countriesByContinent = countries.filter(
      (country) => country.continent.toLowerCase() === continent.toLowerCase()
    );

    if (countriesByContinent.length === 0) {
      return res
        .status(404)
        .json({ error: "No countries found for this continent" });
    }

    res.json(countriesByContinent);
  } catch (error) {
    console.error("Error fetching countries by continent:", error);
    res.status(500).json({ error: "Failed to fetch countries by continent" });
  }
};

export const getContinents = async (req: Request, res: Response) => {
  try {
    const continents = [
      ...new Set(countries.map((country) => country.continent)),
    ];
    res.json(continents);
  } catch (error) {
    console.error("Error fetching continents:", error);
    res.status(500).json({ error: "Failed to fetch continents" });
  }
};
