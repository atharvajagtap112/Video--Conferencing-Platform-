package com.atharva.backend.config;

import java.security.Principal;

/**
 * Simple Principal implementation for WebSocket users.
 * This is how Spring maps a username to a WebSocket session.
 */
public class StompPrincipal implements Principal {

    private final String name;

    public StompPrincipal(String name) {
        this.name = name;
    }

    @Override
    public String getName() {
        return name;
    }


}