import { Router } from "express";
import { 
  getAllCountries, 
  getCountryById, 
  getCountriesByContinent, 
  getContinents 
} from "../controllers/countryController";

const router = Router();

// GET /api/countries - Get all countries (with optional filtering)
router.get("/", getAllCountries);

// GET /api/countries/continents - Get all continents
router.get("/continents", getContinents);

// GET /api/countries/continent/:continent - Get countries by continent
router.get("/continent/:continent", getCountriesByContinent);

// GET /api/countries/:id - Get country by ID
router.get("/:id", getCountryById);

export default router;
