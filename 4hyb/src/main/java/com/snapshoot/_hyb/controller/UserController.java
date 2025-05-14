package com.snapshoot._hyb.controller;

import com.snapshoot._hyb.dto.RegisterRequest;
import com.snapshoot._hyb.model.Users;
import com.snapshoot._hyb.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;

@Controller
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

     @MessageMapping("/user.addUser")
     @SendTo("/user/topic")
    public Users addUser(
            @Payload Users user)
     {

        return user;
    }

    @MessageMapping("/user.disconnectUser")
    @SendTo("/user/topic")
    public Users disconnectUser(
            @Payload Users user)
    {
        userService.disconnectUser(user);
        return user;
    }

    @GetMapping("/user")
    public ResponseEntity<List<Users>> getConnectedUser() {
        return ResponseEntity.ok(userService.getConnectedUser());
    }




}
