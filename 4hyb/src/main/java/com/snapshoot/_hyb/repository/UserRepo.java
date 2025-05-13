package com.snapshoot._hyb.repository;

import com.snapshoot._hyb.model.Status;
import com.snapshoot._hyb.model.Users;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepo extends JpaRepository<Users, Integer> {
    List<Users> findAllByStatus(Status status);

    Users findByNickname(String nickname);
}
