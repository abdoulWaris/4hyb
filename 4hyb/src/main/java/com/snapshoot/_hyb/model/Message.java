package com.snapshoot._hyb.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Builder
@Data
public class Message {
    private String senderName;
    private String receiverName;
    private String message;
    private String mediaType;
    private Status status;
}
