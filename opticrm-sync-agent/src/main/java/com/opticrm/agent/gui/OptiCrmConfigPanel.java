package com.opticrm.agent.gui;

import com.opticrm.agent.client.OptiCrmClient;
import com.opticrm.agent.config.AgentProperties;
import com.opticrm.agent.config.ConfigPersister;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.swing.*;
import javax.swing.border.EmptyBorder;
import java.awt.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class OptiCrmConfigPanel {

    private final AgentProperties props;
    private final ConfigPersister persister;
    private final OptiCrmClient client;

    public JPanel build() {
        JPanel root = new JPanel(new BorderLayout(10, 10));
        root.setBorder(new EmptyBorder(15, 15, 15, 15));

        JPanel form = new JPanel(new GridBagLayout());
        GridBagConstraints g = new GridBagConstraints();
        g.insets = new Insets(6, 6, 6, 6);
        g.anchor = GridBagConstraints.WEST;
        g.fill = GridBagConstraints.HORIZONTAL;

        JTextField urlField = new JTextField(props.getOpticrm().getServerUrl(), 30);
        JTextField tenantField = new JTextField(props.getOpticrm().getTenantId(), 30);
        JTextField keyField = new JTextField(props.getOpticrm().getAgentKey(), 30);

        int row = 0;
        g.gridx = 0; g.gridy = row;
        form.add(new JLabel("URL serveur OptiCRM :"), g);
        g.gridx = 1; g.weightx = 1.0;
        form.add(urlField, g);

        row++; g.gridx = 0; g.gridy = row; g.weightx = 0;
        form.add(new JLabel("Tenant ID :"), g);
        g.gridx = 1; g.weightx = 1.0;
        form.add(tenantField, g);

        row++; g.gridx = 0; g.gridy = row; g.weightx = 0;
        form.add(new JLabel("Clé d'agent (X-Agent-Key) :"), g);
        g.gridx = 1; g.weightx = 1.0;
        form.add(keyField, g);

        JLabel helpLabel = new JLabel(
                "<html><i>" +
                "<b>URL serveur</b> = adresse du <b>backend</b> OptiCRM (port 8081 en local, " +
                "<code>https://kasoft.selfip.net</code> en production).<br>" +
                "<b>Tenant ID</b> facultatif : la clé d'agent identifie déjà le tenant.<br>" +
                "Générez la clé dans OptiCRM → Intégration Sage → Agent local → Nouvel agent." +
                "</i></html>");
        helpLabel.setForeground(Color.GRAY);
        row++; g.gridx = 0; g.gridy = row; g.gridwidth = 2;
        form.add(helpLabel, g);

        root.add(form, BorderLayout.NORTH);

        JTextArea status = new JTextArea(8, 60);
        status.setEditable(false);
        status.setBackground(new Color(245, 245, 245));
        status.setFont(new Font(Font.MONOSPACED, Font.PLAIN, 12));
        status.setBorder(BorderFactory.createTitledBorder("Résultat"));
        root.add(new JScrollPane(status), BorderLayout.CENTER);

        JPanel buttons = new JPanel(new FlowLayout(FlowLayout.RIGHT));
        JButton testBtn = new JButton("Tester la connexion");
        JButton saveBtn = new JButton("Enregistrer");
        buttons.add(testBtn);
        buttons.add(saveBtn);
        root.add(buttons, BorderLayout.SOUTH);

        Runnable readForm = () -> {
            props.getOpticrm().setServerUrl(urlField.getText().trim());
            props.getOpticrm().setTenantId(tenantField.getText().trim());
            props.getOpticrm().setAgentKey(keyField.getText().trim());
        };

        testBtn.addActionListener(e -> {
            readForm.run();
            status.setText("Test en cours…\n");
            new SwingWorker<String, Void>() {
                @Override protected String doInBackground() {
                    try {
                        Object r = client.register().block();
                        return "✓ Connexion OK\n\nRéponse serveur :\n" + r;
                    } catch (Exception ex) {
                        return "✗ Échec : " + ex.getMessage();
                    }
                }
                @Override protected void done() {
                    try { status.setText(get()); } catch (Exception ex) { status.setText(ex.getMessage()); }
                }
            }.execute();
        });

        saveBtn.addActionListener(e -> {
            readForm.run();
            persister.save(props);
            status.setText("Configuration enregistrée dans agent-config.yml");
        });

        return root;
    }
}
