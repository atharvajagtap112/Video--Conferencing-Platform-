package com.atharva.backend.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

/**
 * Calls the Google Gemini API to summarize a meeting transcript
 * into structured JSON with keys: executiveSummary, keyPoints,
 * decisions, actionItems, risks, openQuestions, followUps.
 */
@Service
@Slf4j
public class GeminiSummaryServiceImpl implements GeminiSummaryService {

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.model:gemini-2.0-flash}")
    private String model;

    private final RestTemplate rest = new RestTemplate();
    private final ObjectMapper mapper;

    public GeminiSummaryServiceImpl(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    @Override
    public String summarizeJson(String transcriptText) {
        try {
            String prompt = """
                    You are a meeting summarization assistant.
                    Analyze the following meeting transcript and return ONLY valid JSON (no markdown fences, no explanation) with these exact keys:
                    
                    {
                      "executiveSummary": "A concise 2-3 sentence overview of the meeting",
                      "keyPoints": ["point 1", "point 2", ...],
                      "decisions": ["decision 1", "decision 2", ...],
                      "actionItems": [{"owner": "person", "task": "description", "deadline": "if mentioned"}],
                      "risks": ["risk 1", "risk 2", ...],
                      "openQuestions": ["question 1", "question 2", ...],
                      "followUps": ["follow-up 1", "follow-up 2", ...]
                    }
                    
                    If a section has no items, use an empty array [].
                    
                    Transcript:
                    """ + transcriptText;

            String body = "{\"contents\":[{\"parts\":[{\"text\":" + mapper.writeValueAsString(prompt) + "}]}]}";
            // Use v1beta with gemini-2.5-flash (verified working)
            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey;
            
            log.info("Attempting Gemini API call to: {}", url.replace(apiKey, "***"));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            log.info("Calling Gemini API — model={}, transcript length={}", model, transcriptText.length());
            ResponseEntity<String> response = rest.exchange(url, HttpMethod.POST, new HttpEntity<>(body, headers), String.class);

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                throw new RuntimeException("Gemini API returned " + response.getStatusCode());
            }

            JsonNode root = mapper.readTree(response.getBody());
            String text = root.path("candidates").get(0)
                    .path("content").path("parts").get(0)
                    .path("text").asText("");

            // Strip markdown code fences if Gemini wraps the JSON
            text = text.trim()
                    .replaceFirst("^```[a-zA-Z]*\\s*", "")
                    .replaceFirst("\\s*```$", "")
                    .trim();

            // Validate it's actually valid JSON
            mapper.readTree(text);
            log.info("Gemini summary generated successfully — {} chars", text.length());
            return text;

        } catch (Exception e) {
            log.error("Gemini summarization failed: {}", e.getMessage());
            if (e.getMessage() != null && e.getMessage().contains("API_KEY_INVALID")) {
                log.error("Your Gemini API key appears to be invalid. Get a new one from: https://aistudio.google.com/app/apikey");
            }
            throw new RuntimeException("Gemini summarization failed: " + e.getMessage(), e);
        }
    }
}