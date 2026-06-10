package com.opticrm.agent.gui;

import com.opticrm.agent.client.OptiCrmClient;
import com.opticrm.agent.config.AgentProperties;
import com.opticrm.agent.sage.SageConnection;
import com.opticrm.agent.scheduler.PullScheduler;
import com.opticrm.agent.scheduler.PushScheduler;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import javax.swing.*;
import javax.swing.border.EmptyBorder;
import java.awt.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Component
@RequiredArgsConstructor
public class StatusPanel {

    private final AgentProperties props;
    private final SageConnection sageConnection;
    private final OptiCrmClient optiCrmClient;
    private final PullScheduler pullScheduler;
    private final PushScheduler pushScheduler;

    private JLabel sageStatus;
    private JLabel opticrmStatus;
    private JLabel lastPullLabel;
    private JLabel lastPushLabel;
    private Timer refreshTimer;
    private static final DateTimeFormatter DT = DateTimeFormatter.ofPattern("dd/MM HH:mm:ss");

    public JPanel build() {
        JPanel root = new JPanel(new BorderLayout(10, 10));
        root.setBorder(new EmptyBorder(20, 20, 20, 20));

        JPanel grid = new JPanel(new GridLayout(2, 2, 16, 16));

        sageStatus    = createCard("Sage SQL Server", "Test en cours…", new Color(255, 165, 0));
        opticrmStatus = createCard("Serveur OptiCRM", "Test en cours…", new Color(255, 165, 0));
        lastPullLabel = createCard("Dernier Pull (Sage→CRM)", "—", new Color(70, 130, 180));
        lastPushLabel = createCard("Dernier Push (CRM→Sage)", "—", new Color(70, 130, 180));

        grid.add(wrap(sageStatus));
        grid.add(wrap(opticrmStatus));
        grid.add(wrap(lastPullLabel));
        grid.add(wrap(lastPushLabel));

        root.add(grid, BorderLayout.CENTER);

        JPanel actions = new JPanel(new FlowLayout(FlowLayout.CENTER, 12, 6));
        JButton pullNow = new JButton("Pull maintenant (Sage → CRM)");
        JButton pushNow = new JButton("Push maintenant (CRM → Sage)");
        actions.add(pullNow);
        actions.add(pushNow);
        root.add(actions, BorderLayout.SOUTH);

        pullNow.addActionListener(e -> new Thread(() -> {
            try { pullScheduler.runPull(); }
            catch (Exception ex) { showError("Pull", ex); }
        }, "manual-pull").start());

        pushNow.addActionListener(e -> new Thread(() -> {
            try { pushScheduler.runPush(); }
            catch (Exception ex) { showError("Push", ex); }
        }, "manual-push").start());

        refreshTimer = new Timer(15_000, e -> refresh());
        refreshTimer.setInitialDelay(500);
        refreshTimer.start();

        return root;
    }

    private void refresh() {
        new SwingWorker<Void, Void>() {
            @Override protected Void doInBackground() {
                boolean sageOk = sageConnection.ping();
                SwingUtilities.invokeLater(() -> updateLabel(sageStatus,
                        sageOk ? "✓ En ligne" : "✗ Hors ligne",
                        sageOk ? new Color(46, 160, 67) : new Color(207, 34, 46)));

                boolean crmOk = false;
                try { optiCrmClient.heartbeat("OK", null).block(); crmOk = true; }
                catch (Exception ignored) {}
                final boolean crmOkFinal = crmOk;
                SwingUtilities.invokeLater(() -> updateLabel(opticrmStatus,
                        crmOkFinal ? "✓ Connecté" : "✗ Inaccessible",
                        crmOkFinal ? new Color(46, 160, 67) : new Color(207, 34, 46)));
                return null;
            }
        }.execute();
    }

    private JLabel createCard(String title, String value, Color color) {
        JLabel lbl = new JLabel("<html><b>" + title + "</b><br><span style='font-size:14px'>" + value + "</span></html>");
        lbl.setForeground(color);
        lbl.setHorizontalAlignment(SwingConstants.CENTER);
        lbl.setFont(lbl.getFont().deriveFont(13f));
        return lbl;
    }

    private void updateLabel(JLabel label, String value, Color color) {
        String html = label.getText();
        int start = html.indexOf("<b>") + 3;
        int end = html.indexOf("</b>");
        String title = html.substring(start, end);
        label.setText("<html><b>" + title + "</b><br><span style='font-size:14px'>" + value + "</span></html>");
        label.setForeground(color);
    }

    private JPanel wrap(JLabel l) {
        JPanel p = new JPanel(new BorderLayout());
        p.setBorder(BorderFactory.createLineBorder(new Color(200, 200, 200)));
        p.setBackground(Color.WHITE);
        p.add(l, BorderLayout.CENTER);
        return p;
    }

    private void showError(String op, Exception ex) {
        SwingUtilities.invokeLater(() -> JOptionPane.showMessageDialog(null,
                op + " échoué : " + ex.getMessage(),
                "Erreur", JOptionPane.ERROR_MESSAGE));
    }

    public void reportPull(boolean success, int count) {
        SwingUtilities.invokeLater(() -> updateLabel(lastPullLabel,
                LocalDateTime.now().format(DT) + " — " + (success ? count + " lignes" : "échec"),
                success ? new Color(46, 160, 67) : new Color(207, 34, 46)));
    }

    public void reportPush(boolean success, int count) {
        SwingUtilities.invokeLater(() -> updateLabel(lastPushLabel,
                LocalDateTime.now().format(DT) + " — " + (success ? count + " docs" : "échec"),
                success ? new Color(46, 160, 67) : new Color(207, 34, 46)));
    }
}
