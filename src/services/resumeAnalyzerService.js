import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

export const analyzeResume = async (resumeText, jobDescription) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/analyze-resume`, {
      resumeText,
      jobDescription,
    });
    return response.data;
  } catch (error) {
    console.error("Error analyzing resume:", error);
    throw error;
  }
};

export const extractTextFromPDF = async (file) => {
  try {
    const FormData = (await import("form-data")).default;
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post(
      `${API_BASE_URL}/extract-pdf`,
      formData,
      {
        headers: formData.getHeaders(),
      }
    );
    return response.data.text;
  } catch (error) {
    console.error("Error extracting PDF:", error);
    throw error;
  }
};

export const extractTextFromImage = async (file) => {
  try {
    const Tesseract = (await import("tesseract.js")).default;
    const result = await Tesseract.recognize(file, "eng");
    return result.data.text;
  } catch (error) {
    console.error("Error extracting text from image:", error);
    throw error;
  }
};
