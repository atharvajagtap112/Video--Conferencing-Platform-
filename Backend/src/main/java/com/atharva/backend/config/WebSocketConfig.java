package com.atharva.backend.config;



import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Server → Client: messages sent to /topic/* or /queue/*
        registry.enableSimpleBroker("/topic", "/queue");// in memory storage area client subcribe this
        // Client → Server: messages sent to /app/*
        registry.setApplicationDestinationPrefixes("/app"); //This is for sending messages after you're connected.
         //Frontend:
        //
        //stompClient.publish({
        //    destination: "/app/chat",
        //    body: JSON.stringify(msg)
        //});

    }



    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Clients connect here: ws://localhost:8080/ws
        registry.addEndpoint("/ws")
                //ws
                //
                //This is just the connection endpoint.
                //After the connection is established, you normally don't use /ws again.
                .setAllowedOriginPatterns("*")
                .withSockJS(); // Fallback for browsers without WebSocket
    }


    //const socket = new SockJS("http://localhost:8080/ws");
    //
    //or
    //
    //const socket = new WebSocket("ws://localhost:8080/ws");

    
    
    
    // ═��══════════════════════════════════════════
    // THIS is what maps "bob" → his WebSocket session
    // ════════════════════════════════════════════
    //It's used when you want user-specific messaging instead of broadcasting to everyone.
     //Similar to a Servlet Filter or Spring Security Filter, but for WebSocket messages.
    //This interceptor runs when a WebSocket client connects, extracts the user's identity
    // (username/JWT), and stores it as a Principal in the WebSocket session so Spring can later
    // send messages to that specific user using convertAndSendToUser().
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor =
                        MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

                if (accessor != null &&
                        StompCommand.CONNECT.equals(accessor.getCommand())) {

                    // Client sends JWT or username in STOMP headers
                    String username = accessor.getFirstNativeHeader("username");

                    if (username != null) {
                        // Set the Principal — this is what convertAndSendToUser uses
                        accessor.setUser(new StompPrincipal(username));
                    }
                }
                return message;
            }
        });
    }
}