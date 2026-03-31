package com.opticrm.security.service;

import com.opticrm.security.entity.User;
import com.opticrm.security.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserExportService {

    private final UserRepository userRepository;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")
            .withZone(ZoneId.of("Africa/Casablanca"));

    private static final String[] HEADERS = {
            "Prénom", "Nom", "Email", "Téléphone", "Rôle", "Équipe", "Territoire", "Statut", "Dernière connexion", "Date création"
    };

    public byte[] exportToExcel(String search, UUID roleId, Boolean isActive) throws IOException {
        String searchTerm = (search != null && !search.trim().isEmpty()) ? search.trim() : "";

        // Reuse the same filtered query, but get all records (no pagination)
        List<User> users = userRepository.findAllFilteredList(searchTerm, roleId, isActive);

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Utilisateurs");

            // Header style
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setFontHeightInPoints((short) 11);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.LIGHT_CORNFLOWER_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);

            // Create header row
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < HEADERS.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(HEADERS[i]);
                cell.setCellStyle(headerStyle);
            }

            // Data style
            CellStyle dataStyle = workbook.createCellStyle();
            dataStyle.setBorderBottom(BorderStyle.THIN);
            dataStyle.setBorderTop(BorderStyle.THIN);
            dataStyle.setBorderLeft(BorderStyle.THIN);
            dataStyle.setBorderRight(BorderStyle.THIN);

            // Fill data
            int rowIdx = 1;
            for (User user : users) {
                Row row = sheet.createRow(rowIdx++);
                createCell(row, 0, user.getFirstName(), dataStyle);
                createCell(row, 1, user.getLastName(), dataStyle);
                createCell(row, 2, user.getEmail(), dataStyle);
                createCell(row, 3, user.getPhone() != null ? user.getPhone() : "", dataStyle);
                createCell(row, 4, user.getRole() != null ? user.getRole().getName() : "", dataStyle);
                createCell(row, 5, user.getTeam() != null ? user.getTeam().getName() : "", dataStyle);
                createCell(row, 6, user.getTerritory() != null ? user.getTerritory().getName() : "", dataStyle);
                createCell(row, 7, Boolean.TRUE.equals(user.getIsActive()) ? "Actif" : "Inactif", dataStyle);
                createCell(row, 8, user.getLastLoginAt() != null ? DATE_FMT.format(user.getLastLoginAt()) : "Jamais", dataStyle);
                createCell(row, 9, user.getCreatedAt() != null ? DATE_FMT.format(user.getCreatedAt()) : "", dataStyle);
            }

            // Auto-size columns
            for (int i = 0; i < HEADERS.length; i++) {
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }

    private void createCell(Row row, int col, String value, CellStyle style) {
        Cell cell = row.createCell(col);
        cell.setCellValue(value);
        cell.setCellStyle(style);
    }
}
