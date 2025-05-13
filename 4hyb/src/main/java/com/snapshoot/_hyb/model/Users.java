package com.snapshoot._hyb.model;

import lombok.*;

@AllArgsConstructor
@NoArgsConstructor
@Data
@ToString
@Builder
public class Users {
    private int id;
    private String name;
    private int age;
    private String Nickname;
    private Status status;
}
