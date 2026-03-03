package com.zoe.checkit.web;

import com.zoe.checkit.auth.AppPrincipal;
import com.zoe.checkit.todo.TodoItem;
import com.zoe.checkit.todo.TodoService;
import com.zoe.checkit.user.UserAccount;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/todos")
public class TodoController {

    private final TodoService todoService;

    public TodoController(TodoService todoService) {
        this.todoService = todoService;
    }

    @GetMapping
    public List<TodoResponse> getByDate(
            @AuthenticationPrincipal AppPrincipal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        UserAccount user = principal.user();
        LocalDate target = date == null ? LocalDate.now() : date;
        return todoService.getByDate(user, target).stream()
                .map(TodoController::toResponse)
                .toList();
    }

    @PostMapping
    public ResponseEntity<TodoResponse> create(
            @AuthenticationPrincipal AppPrincipal principal,
            @RequestBody CreateTodoRequest request
    ) {
        if (request.text() == null || request.text().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        LocalDate date = request.date() == null ? LocalDate.now() : request.date();
        TodoItem created = todoService.create(principal.user(), date, request.text().trim());
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(created));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<TodoResponse> toggle(
            @AuthenticationPrincipal AppPrincipal principal,
            @PathVariable Long id,
            @RequestBody UpdateTodoRequest request
    ) {
        try {
            TodoItem updated = todoService.updateCompletion(principal.user(), id, request.completed());
            return ResponseEntity.ok(toResponse(updated));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/summary")
    public Map<String, DaySummaryResponse> summary(
            @AuthenticationPrincipal AppPrincipal principal,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM") YearMonth month
    ) {
        YearMonth target = month == null ? YearMonth.now() : month;
        return todoService.monthSummary(principal.user(), target).entrySet().stream()
                .collect(Collectors.toMap(
                        entry -> entry.getKey().toString(),
                        entry -> new DaySummaryResponse(entry.getValue().total(), entry.getValue().completed(), entry.getValue().rate())
                ));
    }

    private static TodoResponse toResponse(TodoItem item) {
        return new TodoResponse(item.getId(), item.getText(), item.isCompleted(), item.getTargetDate().toString());
    }

    public record CreateTodoRequest(String text, @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {}
    public record UpdateTodoRequest(boolean completed) {}
    public record TodoResponse(Long id, String text, boolean completed, String date) {}
    public record DaySummaryResponse(int total, int completed, int rate) {}
}
