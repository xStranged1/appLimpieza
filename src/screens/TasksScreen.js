import React, { memo, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, SafeAreaView, View, Image, Alert, TouchableOpacity, Button, SectionList, Pressable, ScrollView } from "react-native";
import { initializeApp } from "firebase/app";
import { getFirestore, writeBatch, collection, query, querySnapshot, getDocs, orderBy, onSnapshot, QuerySnapshot, setDoc,
doc, where, serverTimestamp, updateDoc, deleteDoc, getDoc } from "firebase/firestore";

import firebaseConfig from "../firebase-config";
import styles from "../screens/stylesScreens";
import { MultiSelect } from "react-native-element-dropdown";
import TaskView from './components/TaskView'
export default function TasksScreen({ navigate, route }) {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  //datepicker
  const [date, setDate] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [sectors, setSectors] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [task_frec, setTask_frec] = useState(1);
  const [user, setUser] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selected, setSelected] = useState([]);
  const [taskSelected, setTaskSelected] = useState([]);
  const [taskAvaiable, setTaskAvaiable] = useState([]);

  const batch = writeBatch(db);

  //efect on update checklist
  const onUpdateCheck = useRef(true);
  const [cond, setCond] = useState(false);
  
  const [checkList, setCheckList] = useState([]);

  
  const [markAll, setMarkAll] = useState(false);

  const [checked, setChecked] = useState("unchecked");

  

  let contador = -1;

  const verChecklist = () => {
    checkList.forEach((element, i) => {
      console.log("tarea: " + i + ": " + element);
    });
  };
  const verTaskSelected = () => {
    let id = [];
    console.log("paso n veces");
    tasks.forEach((element) => {
      console.log("paso b veces");

      id = element.id;
      id.forEach((d) => {
        console.log("id: " + d);
      });
    });
  };

  const setAllChecked = () => {
    let c = checkList;
    console.log('marcar todas');
      if (!markAll){
        c.forEach((task, i) => {
          c[i] = 'checked';
        });
        setMarkAll(true)
      }else{
        c.forEach((task, i) => {
          c[i] = 'unchecked';
        });
        setMarkAll(false)
      }
    setCheckList(c)
  }
  
  const ejecuteQuery = (item) => {
    console.log('HACE QUERY');
    console.log('HACE QUERY');
    console.log('HACE QUERY');
    let collectionRef = collection(db, "tasks");
    let unsuscribe;
    let TaskQuery = [];
    let tasksAndSector = [];
    let nid = 0;

    if (item) {
      item.forEach(async (element) => {
        let q = query(collectionRef, where("task_sector", "==", element));

        const querySnapshot = await getDocs(q);
       

          TaskQuery = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            taskName: doc.data().task_name,
            defaultAssigned: doc.data().default_assigned,
          }));
          if (TaskQuery == "") {
            console.log("taskquery vacio");
          } else {
            let Tasks = [];

            TaskQuery.forEach((task) => {
              let objTask = {}
              objTask.taskName = task.taskName;
              objTask.defaultAssigned = task.defaultAssigned;
              objTask.id = task.id;
              
              Tasks.push(objTask);
            });

            let singleObj = {};
            singleObj["title"] = element;
            singleObj["data"] = Tasks;

            tasksAndSector.push(singleObj);

            let firstTask = tasksAndSector[0]
            firstTask = firstTask.data
            firstTask = firstTask[0]
            setTaskAvaiable(tasksAndSector);
          }
      });
    } else {
      console.log("se setea vacio");
      setTasks([]);
    }
  };

  const renderItem = ({ item }) => {
    if (selected) {
      console.log("selected: " + selected);

      console.log("item renderItem: " + item.title);
      return <Item title={item.title} />;
    } else {
      setTasks([]);
    }
  };
  
  const Item = ({ title }) => (
    <View style={styles.itemSectionlist}>
      <Text style={styles.titleSectionlist}>{title}</Text>
    </View>
  );

  
  const cleanTasks = () => {
    contador=-1;
    setCheckList([])
    setTaskAvaiable([])
    setTasks([])
  }

  const addTaskSelected = (item) => {
    let arregloTasks = [];
    if (item) {
      item.forEach((sector) => {
        let singleObj = {};
        singleObj["title"] = sector;
        singleObj["id"] = sector;
        arregloTasks.push(singleObj);
      });
      setTaskSelected(arregloTasks);
    }
  };

  const _renderItem = (item) => {
    return (
      <View style={styles.item}>
        <Text style={styles.textItem}>{item.label}</Text>
        <Image style={styles.icon} />
      </View>
    );
  };

  

  
  

  


  useEffect(() => {
    console.log("entro assignTaskScreen");
    let collectionRef = collection(db, "sectors");
    let q = query(collectionRef, orderBy("sector_name", "desc"));

    let unsuscribe = onSnapshot(q, (querySnapshot) => {
      let sectors = [];

      sectors = querySnapshot.docs.map((doc) => ({
        sector_name: doc.data().sector_name,
        sector_description: doc.data().sector_description,
      }));

      let arregloSectores = [];
      if (sectors) {
        sectors.forEach((sector) => {
          let singleObj = {};
          singleObj["label"] = sector.sector_name;
          singleObj["value"] = sector.sector_name;
          arregloSectores.push(singleObj);
        });
        setSectors(arregloSectores);
      } else console.log("No hay sectores");
    });

    return unsuscribe;
  }, []);


  const getAllTasks = async () => {
    const q = query(collection(db, "tasks"), where("task_name", "!=", null));
    let tasks = []
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((doc) => {
      // doc.data() is never undefined for query doc snapshots
      tasks.push(doc.data())
    });
    return tasks
  }
  

  const commitBatch = async () => {
    await batch.commit().then(() => {
      Alert.alert('Change successfully!')
    })
  }


  const putAllTasksDefaultActive = async () => {
      let allTasks = await getAllTasks();
      console.log(allTasks);
      console.log(allTasks.length);
      
      allTasks.forEach((task) => {
          let ref = doc(db, "tasks", task.task_name);
          batch.update(ref, { default_assigned: true });
      });
      commitBatch();

  }
  
  const changeDefault = async (task) => {
    const ref = doc(db, "tasks", task.taskName);
    await updateDoc(ref, {default_assigned: !task.defaultAssigned})
    getIndexTask(task)
  }
  const ListTasks = ( {data} ) => {
    
    console.log('PASA LISTTASK');
    
    return (
      <View>
        {data && (
          data.map((task) => (<TaskView key={task.id} task={task}/>))
        )}
      </View>
    )
  }
  return (
    <SafeAreaView style={styles.container}>

      <MultiSelect
        renderLeftIcon={() => <Image style={styles.icon} />}
        containerStyle={styles.shadow}
        style={styles.dropdown}
        data={sectors}
        labelField="label"
        valueField="value"
        label="Multi Select"
        placeholder="En el sector"
        search
        searchPlaceholder="Buscar sector"
        value={selected}
        onChange={(item) => {
          cleanTasks();
          addTaskSelected(item);
          setSelected(item);
          ejecuteQuery(item);
        }}
        renderItem={(item) => _renderItem(item)}
      />
      <View style={{ width: 200, marginTop: 15 }}>
        <Button
          title="Ver tareas disponibles"
          color="#B0C4DE"
          onPress={() => {
            setTasks(taskAvaiable);
          }}
        />
      </View>
      <View style={{ marginTop: 15 }} />

      <ScrollView>
          {tasks.map((sector, i) => {
            let data = sector.data

            return(
              <View>
                <Text style={styles.SectionHeader}>{sector.title}</Text>
                <ListTasks key={sector.title} data={data} />
              </View>
              )
            })
        }
      </ScrollView>

      {/* <SectionList
        style={{ height: "34%", maxWidth: "95%" }}
        sections={tasks}
        renderItem={renderSectionList}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.SectionHeader}>{title}</Text>
        )}
      /> */}
      
      {/* <Pressable onPress={putAllTasksDefaultActive}>
        <Text>actualizar</Text>
      </Pressable> */}
    
    </SafeAreaView>
  );
}
