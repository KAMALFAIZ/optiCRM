package com.opticrm.agent.gui;

import com.opticrm.agent.config.AgentProperties;
import com.opticrm.agent.config.ConfigPersister;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import javax.swing.*;
import java.awt.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class AgentMainWindow {

    @Autowired private AgentProperties props;
    @Autowired private ConfigPersister persister;
    @Autowired private OptiCrmConfigPanel optiCrmPanel;
    @Autowired private SageConfigPanel sagePanel;
    @Autowired private LogsPanel logsPanel;
    @Autowired private StatusPanel statusPanel;

    private JFrame frame;

    @EventListener(ApplicationReadyEvent.class)
    public void show() {
        if (GraphicsEnvironment.isHeadless()) {
            log.info("Mode headless — UI Swing désactivée");
            return;
        }
        SwingUtilities.invokeLater(this::build);
    }

    private void build() {
        try {
            UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
        } catch (Exception ignored) {}

        frame = new JFrame("OptiCRM Sync Agent — Configuration");
        frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        frame.setSize(900, 650);
        frame.setLocationRelativeTo(null);

        JTabbedPane tabs = new JTabbedPane();
        tabs.addTab("Statut", new ImageIcon(), statusPanel.build(), "Vue d'ensemble");
        tabs.addTab("OptiCRM", null, optiCrmPanel.build(), "Configuration serveur OptiCRM");
        tabs.addTab("Sage 100", null, sagePanel.build(), "Configuration SQL Server Sage");
        tabs.addTab("Logs", null, logsPanel.build(), "Journal de synchronisation en temps réel");

        frame.setContentPane(tabs);
        frame.setVisible(true);
        frame.setExtendedState(JFrame.NORMAL);
        frame.toFront();
        frame.requestFocus();
        // Force au-dessus brièvement puis libère pour ne pas gêner l'utilisateur ensuite
        frame.setAlwaysOnTop(true);
        Timer t = new Timer(500, e -> frame.setAlwaysOnTop(false));
        t.setRepeats(false);
        t.start();

        log.info("UI Agent prête — fenêtre affichée");
    }
}
