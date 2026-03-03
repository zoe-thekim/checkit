package com.zoe.checkit.todo;

import com.zoe.checkit.user.UserAccount;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TodoItemRepository extends JpaRepository<TodoItem, Long> {

    List<TodoItem> findByOwnerAndTargetDateOrderByCompletedAscCreatedAtAsc(UserAccount owner, LocalDate targetDate);

    List<TodoItem> findByOwnerAndTargetDateBetween(UserAccount owner, LocalDate from, LocalDate to);

    Optional<TodoItem> findByIdAndOwner(Long id, UserAccount owner);
}
