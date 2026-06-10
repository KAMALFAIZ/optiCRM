package com.opticrm.agent.gui;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.AppenderBase;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.swing.*;
import javax.swing.border.EmptyBorder;
import javax.swing.text.BadLocationException;
import javax.swing.text.DefaultCaret;
import javax.swing.text.Document;
import java.awt.*;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

@Component
public class LogsPanel {

    private JTextArea logArea;
    private static final int MAX_LINES = 5000;
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("HH:mm:ss");

    public JPanel build() {
        JPanel root = new JPanel(new BorderLayout(10, 10));
        root.setBorder(new EmptyBorder(15, 15, 15, 15));

        logArea = new JTextArea();
        logArea.setEditable(false);
        logArea.setBackground(new Color(30, 30, 30));
        logArea.setForeground(new Color(220, 220, 220));
        logArea.setFont(new Font(Font.MONOSPACED, Font.PLAIN, 12));
        ((DefaultCaret) logArea.getCaret()).setUpdatePolicy(DefaultCaret.ALWAYS_UPDATE);

        JScrollPane scroll = new JScrollPane(logArea);
        scroll.setBorder(BorderFactory.createTitledBorder("Logs de synchronisation"));
        root.add(scroll, BorderLayout.CENTER);

        JPanel toolbar = new JPanel(new FlowLayout(FlowLayout.RIGHT));
        JButton clearBtn = new JButton("Effacer");
        JCheckBox autoScroll = new JCheckBox("Défilement auto", true);
        toolbar.add(autoScroll);
        toolbar.add(clearBtn);
        root.add(toolbar, BorderLayout.SOUTH);

        clearBtn.addActionListener(e -> logArea.setText(""));

        // Attach as Logback appender
        Logger rootLogger = (Logger) LoggerFactory.getLogger(Logger.ROOT_LOGGER_NAME);
        GuiAppender appender = new GuiAppender();
        appender.setContext(rootLogger.getLoggerContext());
        appender.start();
        rootLogger.addAppender(appender);

        return root;
    }

    private void appendLine(String line) {
        SwingUtilities.invokeLater(() -> {
            logArea.append(line + "\n");
            Document doc = logArea.getDocument();
            int lines = logArea.getLineCount();
            if (lines > MAX_LINES) {
                try {
                    int end = logArea.getLineEndOffset(lines - MAX_LINES);
                    doc.remove(0, end);
                } catch (BadLocationException ignored) {}
            }
        });
    }

    private class GuiAppender extends AppenderBase<ILoggingEvent> {
        @Override protected void append(ILoggingEvent event) {
            if (event.getLevel().toInt() < Level.INFO_INT) return;
            String marker = switch (event.getLevel().toString()) {
                case "ERROR" -> "✗";
                case "WARN"  -> "⚠";
                default      -> "•";
            };
            String line = String.format("[%s] %s %s %s",
                    LocalTime.now().format(TIME),
                    marker,
                    event.getLoggerName().substring(event.getLoggerName().lastIndexOf('.') + 1),
                    event.getFormattedMessage());
            appendLine(line);
        }
    }
}
