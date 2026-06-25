package com.atharva.backend.sfu.dto;


import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class SfuTokenResponse {
    private String token;
    private String url;
}