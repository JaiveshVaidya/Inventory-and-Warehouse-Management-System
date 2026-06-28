package com.iwms.service;

import com.iwms.config.JwtUtils;
import com.iwms.dto.JwtResponse;
import com.iwms.dto.LoginRequest;
import com.iwms.dto.UserRegistrationRequest;
import com.iwms.entity.Role;
import com.iwms.entity.User;
import com.iwms.entity.Warehouse;
import com.iwms.repository.UserRepository;
import com.iwms.repository.WarehouseRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;
    private final WarehouseRepository warehouseRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    public AuthService(AuthenticationManager authenticationManager, JwtUtils jwtUtils,
                       UserRepository userRepository, WarehouseRepository warehouseRepository,
                       PasswordEncoder passwordEncoder, AuditLogService auditLogService) {
        this.authenticationManager = authenticationManager;
        this.jwtUtils = jwtUtils;
        this.userRepository = userRepository;
        this.warehouseRepository = warehouseRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditLogService = auditLogService;
    }

    public JwtResponse authenticateUser(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        User userDetails = (User) authentication.getPrincipal();
        
        Long warehouseId = null;
        String warehouseName = null;
        if (userDetails.getWarehouse() != null) {
            warehouseId = userDetails.getWarehouse().getId();
            warehouseName = userDetails.getWarehouse().getName();
        }

        auditLogService.log("USER_LOGIN", "User logged in successfully: " + userDetails.getUsername());

        return JwtResponse.builder()
                .token(jwt)
                .id(userDetails.getId())
                .username(userDetails.getUsername())
                .email(userDetails.getEmail())
                .role(userDetails.getRole().name())
                .warehouseId(warehouseId)
                .warehouseName(warehouseName)
                .build();
    }

    @Transactional
    public User registerUser(UserRegistrationRequest registrationRequest) {
        if (userRepository.existsByUsername(registrationRequest.getUsername())) {
            throw new RuntimeException("Error: Username is already taken!");
        }

        if (userRepository.existsByEmail(registrationRequest.getEmail())) {
            throw new RuntimeException("Error: Email is already in use!");
        }

        Warehouse warehouse = null;
        if (registrationRequest.getWarehouseId() != null) {
            warehouse = warehouseRepository.findById(registrationRequest.getWarehouseId())
                    .orElseThrow(() -> new RuntimeException("Error: Warehouse not found."));
        }

        User user = User.builder()
                .username(registrationRequest.getUsername())
                .email(registrationRequest.getEmail())
                .password(passwordEncoder.encode(registrationRequest.getPassword()))
                .role(Role.valueOf(registrationRequest.getRole()))
                .warehouse(warehouse)
                .build();

        User savedUser = userRepository.save(user);
        auditLogService.log("USER_REGISTRATION", "Admin registered user: " + user.getUsername() + " with role: " + user.getRole());
        return savedUser;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
}
