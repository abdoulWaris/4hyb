package com.snapshoot._hyb.service;

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

    public Users addUser(Users user){
        user.setStatus(Status.ONLINE);
        return userRepo.save(user);
    }

    public void updateUser(Users user){
        var foundUser = userRepo.findById(user.getId()).orElse(null);
        assert foundUser != null;
        userRepo.save(foundUser);
    }

    public void deleteUser(Users user){
        var foundUser = userRepo.findById(user.getId()).orElse(null);
        user.setStatus(Status.OFFLINE);
        userRepo.delete(foundUser);
    }

    public List<Users> getConnectedUser(){
        return userRepo.findAllByStatus(Status.ONLINE);
    }

    public Users getUserByNickname(String nickname){
        return userRepo.findByNickname(nickname);
    }


}
