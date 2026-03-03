package com.zoe.checkit.todo;

import com.zoe.checkit.user.UserAccount;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TodoService {

    private final TodoItemRepository todoItemRepository;

    public TodoService(TodoItemRepository todoItemRepository) {
        this.todoItemRepository = todoItemRepository;
    }

    @Transactional(readOnly = true)
    public List<TodoItem> getByDate(UserAccount owner, LocalDate date) {
        return todoItemRepository.findByOwnerAndTargetDateOrderByCompletedAscCreatedAtAsc(owner, date);
    }

    @Transactional
    public TodoItem create(UserAccount owner, LocalDate date, String text) {
        TodoItem item = new TodoItem();
        item.setOwner(owner);
        item.setTargetDate(date);
        item.setText(text);
        item.setCompleted(false);
        item.setCreatedAt(LocalDateTime.now());
        item.setUpdatedAt(LocalDateTime.now());
        return todoItemRepository.save(item);
    }

    @Transactional
    public TodoItem updateCompletion(UserAccount owner, Long id, boolean completed) {
        TodoItem item = todoItemRepository.findByIdAndOwner(id, owner)
                .orElseThrow(() -> new IllegalArgumentException("Todo not found"));
        item.setCompleted(completed);
        item.setUpdatedAt(LocalDateTime.now());
        return todoItemRepository.save(item);
    }

    @Transactional(readOnly = true)
    public Map<LocalDate, DayProgress> monthSummary(UserAccount owner, YearMonth yearMonth) {
        LocalDate start = yearMonth.atDay(1);
        LocalDate end = yearMonth.atEndOfMonth();
        List<TodoItem> items = todoItemRepository.findByOwnerAndTargetDateBetween(owner, start, end);

        Map<LocalDate, List<TodoItem>> grouped = new LinkedHashMap<>();
        for (TodoItem item : items) {
            grouped.computeIfAbsent(item.getTargetDate(), ignored -> new ArrayList<>()).add(item);
        }

        Map<LocalDate, DayProgress> result = new LinkedHashMap<>();
        grouped.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .forEach(entry -> {
                    int total = entry.getValue().size();
                    int completed = (int) entry.getValue().stream().filter(TodoItem::isCompleted).count();
                    result.put(entry.getKey(), new DayProgress(total, completed));
                });
        return result;
    }

    public record DayProgress(int total, int completed) {
        public int rate() {
            if (total == 0) {
                return 0;
            }
            return Math.round((completed * 100f) / total);
        }
    }
}
