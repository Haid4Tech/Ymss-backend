import { Request, Response } from "express";

// Generic religion data
const religions = [
  { id: 1, name: "Christianity", code: "CHR" },
  { id: 2, name: "Islam", code: "ISL" },
  { id: 3, name: "Hinduism", code: "HIN" },
  { id: 4, name: "Buddhism", code: "BUD" },
  { id: 5, name: "Judaism", code: "JUD" },
  { id: 6, name: "Sikhism", code: "SIK" },
  { id: 7, name: "Jainism", code: "JAI" },
  { id: 8, name: "Bahá'í Faith", code: "BAH" },
  { id: 9, name: "Atheism", code: "ATH" },
  { id: 10, name: "Agnosticism", code: "AGN" },
  { id: 11, name: "Other", code: "OTH" },
];

export const getAllReligions = async (req: Request, res: Response) => {
  try {
    res.json(religions);
  } catch (error) {
    console.error("Error fetching religions:", error);
    res.status(500).json({ error: "Failed to fetch religions" });
  }
};

export const getReligionById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const religion = religions.find((r) => r.id === id);

    if (!religion) {
      return res.status(404).json({ error: "Religion not found" });
    }

    res.json(religion);
  } catch (error) {
    console.error("Error fetching religion:", error);
    res.status(500).json({ error: "Failed to fetch religion" });
  }
};
