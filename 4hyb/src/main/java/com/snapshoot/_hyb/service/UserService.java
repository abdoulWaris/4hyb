package com.snapshoot._hyb.service;

import com.snapshoot._hyb.dto.LoginRequest;
import com.snapshoot._hyb.dto.RegisterRequest;
import com.snapshoot._hyb.model.Status;
import com.snapshoot._hyb.model.Users;
import com.snapshoot._hyb.repository.UserRepo;
import lombok.RequiredArgsConstructor;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepo userRepo;

    public Users addUser(RegisterRequest request){
        Users existingUser = userRepo.findByNickName(request.getNickname());
        if (existingUser != null) {
            throw new IllegalArgumentException("Nickname already taken");
        }
        int MIN_AGE = 16;
        int MAX_AGE = 35;
        if (request.getAge() < MIN_AGE ||  request.getAge() > MAX_AGE) {
            throw new IllegalArgumentException("Age must be between 16 and 35");
        }else {
            Users users = Users.builder()
                    .name(request.getName())
                    .nickName(request.getNickname())
                    .age(request.getAge())
                    .status(Status.ONLINE)
                    .build();

            return userRepo.save(users);
        }

    }

    public Users login(LoginRequest request){
        var foundUser = userRepo.findByNickName(request.getNickname());
        if (foundUser == null) {
            throw new IllegalArgumentException("There is no user with this nickname, please verify your nickname or register");
        }
        foundUser.setStatus(Status.ONLINE);
        userRepo.save(foundUser);
        return foundUser;
    }

    public void deleteUser(Users user){
        var foundUser = userRepo.findById(user.getId()).orElse(null);
        if (foundUser == null) {
            throw new IllegalArgumentException("User not found");
        }
        user.setStatus(Status.DELETE);
        userRepo.delete(foundUser);
    }

    public void disconnectUser(Users user){
        var foundUser = userRepo.findById(user.getId()).orElse(null);
        user.setStatus(Status.OFFLINE);
        if (foundUser != null) {
            foundUser.setStatus(Status.OFFLINE);
            userRepo.save(foundUser);
        }else {
            System.out.println("User not found");
        }
    }

    public List<Users> getConnectedUser(){
        return userRepo.findAllByStatus(Status.ONLINE);
    }

    public Users getConnectedUserByNickname(String nickname){
        Users foundUser = userRepo.findByNickName(nickname);
        if (foundUser == null) {
            throw new IllegalArgumentException("User not found");
        }
        if (foundUser.getStatus() != Status.ONLINE) {
            throw new IllegalStateException("User is not connected");
        }
        return foundUser;
    }


    public void disconnectUserByNickname(String nickname) {
        Users user = userRepo.findByNickName(nickname);
        if (user == null) throw new IllegalArgumentException("User not found");
        user.setStatus(Status.OFFLINE);
        userRepo.save(user);
    }
}
